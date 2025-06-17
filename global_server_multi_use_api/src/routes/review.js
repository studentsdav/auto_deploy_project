const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { getPool } = require('../config/db');
const { Client } = require('pg');

// Function to sanitize property name
const sanitizePropertyName = (propertyName) => {
  return propertyName
    .toLowerCase() // Convert to lowercase
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters except spaces
    .trim() // Remove leading/trailing spaces
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
};

// Function to extract clean name (no underscores)
const extractCleanName = (sanitizedPropertyName) => {
  return sanitizedPropertyName.replace(/_/g, ''); // Remove all underscores
};


const generateStrongPassword = (length = 16) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()-_=+[]{}|;:,.<>?';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    password += chars[randomIndex];
  }
  return password; // Password is returned as a string
};

// Function to deploy client
const deployClient = async (sanitizedName, id) => {
  try {
    const cleanName = sanitizedName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const dbUser = `user_${cleanName}`;
    const dbPassword = generateStrongPassword();
    const dbDatabase = `db${cleanName}`;
    const tablesSqlPath = path.join(__dirname, '../../../sql/tables.sql'); // Path to tables.sql

    const templateDir = path.join(__dirname, '../../../client_template');
    const clientDir = path.join(__dirname, '../../../clients', cleanName);

    if (!fs.existsSync(clientDir)) {
      fs.mkdirSync(clientDir, { recursive: true });
      console.log(`Client directory created: ${clientDir}`);
    } else {
      console.log(`Client directory already exists: ${clientDir}`);
    }




    fs.cpSync(templateDir, clientDir, { recursive: true });
    console.log(`Template files copied to ${clientDir}`);

    const envContent = `
DB_USER=${dbUser}
DB_PASSWORD=${dbPassword}
DB_DATABASE=${dbDatabase}
DB_HOST=localhost
DB_PORT=5432
    `;
    fs.writeFileSync(path.join(clientDir, '.env'), envContent);
    console.log(`.env file created for property: ${cleanName}`);



    const adminClient = new Client({
      user: process.env.DB_USER, // Load from main .env
      host: process.env.DB_HOST,
      database: process.env.DB_DATABASE,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    });

    await adminClient.connect();

    // Create user if it doesn't exist
    await adminClient.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${dbUser}') THEN
              CREATE ROLE "${dbUser}" WITH LOGIN PASSWORD '${dbPassword}';
          ELSE
              ALTER ROLE "${dbUser}" WITH PASSWORD '${dbPassword}';
          END IF;
      END
      $$;
    `);
    console.log(`User ${dbUser} created or already exists.`);

    // Check if database exists
    const dbExistsResult = await adminClient.query(`
      SELECT 1 FROM pg_database WHERE datname = '${dbDatabase}';
    `);

    if (dbExistsResult.rows.length === 0) {
      // Create database
      await adminClient.query(`CREATE DATABASE "${dbDatabase}" OWNER "${dbUser}";`);
      console.log(`Database ${dbDatabase} created successfully.`);
    } else {
      console.log(`Database ${dbDatabase} already exists.`);
    }

    // Grant privileges
    await adminClient.query(`
      GRANT ALL PRIVILEGES ON DATABASE "${dbDatabase}" TO "${dbUser}";
    `);
    console.log(`Privileges granted to user ${dbUser} on database ${dbDatabase}.`);

    // Close admin client
    await adminClient.end();

    // Connect to the new database
    const clientDbConnection = new Client({
      user: dbUser,
      host: 'localhost',
      database: dbDatabase,
      password: dbPassword,
      port: 5432,
    });

    await clientDbConnection.connect();

    // Execute tables.sql to create tables
    const tablesSql = fs.readFileSync(tablesSqlPath, 'utf-8');
    //   console.log(`Executing tables.sql:\n${tablesSql}`); // Debug log
    await clientDbConnection.query(tablesSql);
    console.log(`Tables created successfully in database ${dbDatabase}.`);

    // Connect to admin database to fetch properties data
    const adminClientForProperties = new Client({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_DATABASE,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    });

    await adminClientForProperties.connect();

    const propertiesData = await adminClientForProperties.query('SELECT * FROM properties WHERE property_id = $1', [id]);
    //  console.log(`Fetched properties data from admin database:`, propertiesData.rows);

    // Insert properties data into the client's database
    const insertPropertiesQuery = `
        INSERT INTO properties (property_id, property_name, address, contact_number, email, business_hours, tax_reg_no, state, district, country, currency, is_saved, created_at, updated_at, status   )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `;

    for (const property of propertiesData.rows) {
      await clientDbConnection.query(insertPropertiesQuery, [
        property.property_id,
        property.property_name,
        property.address,
        property.contact_number,
        property.email,
        property.business_hours,
        property.tax_reg_no,
        property.state,
        property.district,
        property.country,
        property.currency,
        property.is_saved,
        property.created_at,
        property.updated_at,
        property.status
      ]);
    }

    console.log(`Properties data inserted successfully into client database.`);

    await adminClientForProperties.end();
    await clientDbConnection.end();

    console.log('Database and table setup, along with properties insertion, completed successfully.');

    const username = cleanName;
    // Trigger subdomain creation
    const command = `node ./utils/createSubdomainConfig.js "${username}" "${dbUser}" "${dbPassword}" "${dbDatabase}"`;

    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error(`Error creating subdomain: ${stderr}`);
        return res.status(500).json({ success: false, message: 'Subdomain creation failed' });
      }

      // Check if subdomain already exists in the script output
      if (stdout.includes('already exists')) {
        console.log(`Subdomain '${username}' already exists.`);
        return res.status(200).json({ success: false, message: `Subdomain '${username}' already exists.` });
      }


      console.log(stdout);
      res.status(200).json({ success: true, message: 'Subdomain created successfully.' });
    });

  } catch (error) {
    console.error('Error during deployment:', error.message);
    throw error;
  }
};

// Route to approve property and deploy client server
router.post('/approve/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Update property status in the database
    const globalPool = getPool(req);
    const result = await globalPool.query(
      `UPDATE properties SET status = $1 WHERE property_id = $2 RETURNING *`,
      ['approved', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    const { property_name } = result.rows[0];

    if (!property_name) {
      return res.status(400).json({ success: false, message: 'Property name is required for deployment.' });
    }

    // Sanitize and extract names
    const sanitized = sanitizePropertyName(property_name); // For directory and configurations
    const cleanName = extractCleanName(sanitized); // For subdomain
    const subdomain = `${cleanName}`; // Subdomain format

    // Deploy client server
    try {
      console.log(`Starting deployment for property: ${property_name}`);
      deployClient(sanitized, id);
      console.log(`Deployment completed for property: ${property_name}`);
      res.json({
        success: true,
        message: `Property approved and server deployed successfully! Subdomain: ${subdomain}`,
      });
    } catch (deployError) {
      console.error('Deployment failed:', deployError.message);
      res.status(500).json({ success: false, message: 'Deployment failed' });
    }

  } catch (err) {
    console.error('Error approving property:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
