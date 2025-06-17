const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Arguments passed to the script
const username = process.argv[2];
const dbUser = process.argv[3];
const dbPassword = process.argv[4];
const dbDatabase = process.argv[5];

// Validate input
if (!username || !dbUser || !dbPassword || !dbDatabase) {
    console.error('Missing arguments! Usage: node createSubdomainConfig.js <username> <dbUser> <dbPassword> <dbDatabase>');
    process.exit(1); // Exit with error
}

// Paths
const configPath = path.join(__dirname, '../config.json');
// const nginxSitesAvailable = `/etc/nginx/sites-available/${username}.conf`;
// const nginxSitesEnabled = `/etc/nginx/sites-enabled/${username}.conf`;

// Function to create subdomain configuration
const createSubdomainConfig = (username, dbUser, dbPassword, dbDatabase) => {
    try {
        let config = {};

        // Check if config.json exists
        if (fs.existsSync(configPath)) {
            config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        } else {
            console.log(`Config file not found. Creating new file at ${configPath}`);
        }

        // Initialize clients object if not present
        if (!config.clients) {
            config.clients = {};
        }

        // Check if the subdomain (username) already exists
        if (config.clients[username]) {
            console.log(`Subdomain '${username}' already exists!`);
            process.exit(0); // Exit without error
        }

        // Add subdomain configuration
        config.clients[username] = {
            // user: dbUser,
            // password: dbPassword,
            // database: dbDatabase,
            host: 'localhost',
            port: 5432,
        };

        // Write the updated configuration back to config.json
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
        console.log(`Subdomain configuration for '${username}' created successfully.`);
    } catch (err) {
        console.error(`Error creating subdomain config: ${err.message}`);
        process.exit(2); // Exit with error
    }
};

// Function to add subdomain to /etc/hosts
const addToHosts = (username) => {
    const hostsEntry = `127.0.0.1 ${username}.localhost\n`;
    const hostsPath = '/etc/hosts';

    try {
        // Check if the entry already exists
        const hostsContent = fs.readFileSync(hostsPath, 'utf-8');
        if (hostsContent.includes(hostsEntry)) {
            console.log(`Subdomain '${username}.localhost' already exists in /etc/hosts.`);
            return;
        }

        // Use sudo to modify /etc/hosts
        execSync(`echo "${hostsEntry}" | sudo tee -a ${hostsPath}`, { stdio: 'inherit' });
        console.log(`Subdomain '${username}.localhost' added to /etc/hosts.`);
    } catch (err) {
        console.error(`Error updating /etc/hosts: ${err.message}`);
        process.exit(3); // Exit with error
    }
};


// Function to configure Nginx
// const configureNginx = (username) => {
//     const nginxConfig = `
// server {
//     listen 80;
//     server_name ${username}.globalserver.fa;

//     location / {
//         proxy_pass http://127.0.0.1:3005; # Replace with your Node.js server
//         proxy_set_header Host $host;
//         proxy_set_header X-Real-IP $remote_addr;
//         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
//     }
// }
// `;
//     try {
//         // Write the Nginx configuration file
//         fs.writeFileSync(nginxSitesAvailable, nginxConfig, 'utf-8');
//         console.log(`Nginx configuration created for '${username}.globalserver.fa'.`);

//         // Enable the site
//         if (!fs.existsSync(nginxSitesEnabled)) {
//             execSync(`sudo ln -s ${nginxSitesAvailable} ${nginxSitesEnabled}`);
//         }

//         // Reload Nginx
//         execSync('sudo systemctl reload nginx');
//         console.log(`Nginx reloaded with new configuration for '${username}.globalserver.fa'.`);
//     } catch (err) {
//         console.error(`Error configuring Nginx: ${err.message}`);
//         process.exit(4); // Exit with error
//     }
// };

// Run the functions
createSubdomainConfig(username, dbUser, dbPassword, dbDatabase);
addToHosts(username);
//configureNginx(username);
process.exit(0); // Exit successfully
