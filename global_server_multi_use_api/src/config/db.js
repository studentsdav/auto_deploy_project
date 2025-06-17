const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

function extractClientNameFromDomain(host) {
  if (host === 'localhost' || host.startsWith('localhost:')) {
    return null; // Global case
  }
  const subdomain = host.split('.')[0];
  return subdomain;
}

function loadEnvironmentVariables(clientName) {
  let envPath;

  if (!clientName) {
    envPath = path.resolve('.env'); // Global .env path
  } else {
    envPath = path.resolve(__dirname, `../../../${clientName}/.env`); // Client-specific .env path
  }

  console.log(`Attempting to load .env from: ${envPath}`); // Debugging log

  if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const key in envConfig) {
      process.env[key] = envConfig[key];
    }
  } else {
    throw new Error(`.env file not found at ${envPath}`);
  }
}

function getPool(req) {
  const host = req.headers.host;
  const clientName = extractClientNameFromDomain(host);

  loadEnvironmentVariables(clientName);

  if (clientName) {
    return new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_DATABASE,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    });
  }

  return new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });
}

module.exports = { getPool };
