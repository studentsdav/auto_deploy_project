const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

function extractClientNameFromDomain(host) {
  // Extract the subdomain (e.g., 'client1' from 'client1.localhost:3005')
  const subdomain = host.split('.')[0];
  if (!subdomain || subdomain === 'localhost') {
    return null; // Return null for global routes
  }
  return subdomain;
}

function loadEnvironmentVariables(clientName) {
  // Construct the path to the client's .env file
  const envPath = path.resolve(__dirname, `../../../${clientName}/.env`);

  if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const key in envConfig) {
      process.env[key] = envConfig[key];
    }
  } else {
    throw new Error(`.env file not found for client at ${envPath}`);
  }
}

function getPool(req) {
  const host = req.headers.host; // e.g., 'client1.localhost:3005'
  const clientName = extractClientNameFromDomain(host);

  if (clientName) {
    loadEnvironmentVariables(clientName);

    // Return client-specific pool
    return new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_DATABASE,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    });
  }

  // If no client name is extracted, return global pool
  // return new Pool({
  //   user: process.env.GLOBAL_DB_USER,
  //   host: process.env.GLOBAL_DB_HOST,
  //   database: process.env.GLOBAL_DB_DATABASE,
  //   password: process.env.GLOBAL_DB_PASSWORD,
  //   port: process.env.GLOBAL_DB_PORT,
  // });
}

module.exports = { getPool };
