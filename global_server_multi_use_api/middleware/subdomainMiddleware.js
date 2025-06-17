const path = require('path');
const fs = require('fs');

const subdomainMiddleware = (req, res, next) => {
  const host = req.headers.host; // Example: client1.localhost:3005 or localhost:3005
  const subdomain = host.split('.')[0]; // Extract subdomain (client1)

  console.log(`Host: ${host}, Subdomain: ${subdomain}`);

  // Check if the request is for the main domain
  if (host === 'localhost:3005' || subdomain === 'localhost') {
    console.log('Main domain detected, using global routes.');
    req.clientDir = null; // Indicate this is a main domain request
    return next();
  }

  // Handle subdomain logic
  if (subdomain && subdomain !== 'www') {
    const clientDir = path.join('../clients', subdomain);

    console.log(`Checking client directory: ${clientDir}`);

    if (fs.existsSync(clientDir)) {
      req.clientDir = clientDir; // Valid client directory
      req.clientName = subdomain; // Subdomain name
      return next();
    } else {
      console.error('Client directory not found for subdomain:', subdomain);
      return res.status(404).send('Client not found.');
    }
  }

  // Default fallback for unhandled cases
  next();
};

module.exports = subdomainMiddleware;
