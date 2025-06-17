const fs = require('fs');
const path = require('path');

const subdomain = process.argv[2];
if (!subdomain) {
    console.error('Subdomain not provided!');
    process.exit(1);
}

const configPath = path.join(__dirname, 'global_server/config.json');

const createSubdomainConfig = (subdomain) => {
    try {
        let config = {};
        if (fs.existsSync(configPath)) {
            config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        }

        if (!config.clients) {
            config.clients = {};
        }

        if (config.clients[subdomain]) {
            console.log('Subdomain already exists!');
            return;
        }

        config.clients[subdomain] = {
            user: `user_${subdomain}`,
            password: `password_${subdomain}`,
            database: `db_${subdomain}`,
            host: 'localhost',
            port: 5432,
        };

        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
        console.log(`Subdomain configuration for ${subdomain} created successfully.`);
    } catch (err) {
        console.error(`Error creating subdomain config: ${err.message}`);
    }
};

createSubdomainConfig(subdomain);
