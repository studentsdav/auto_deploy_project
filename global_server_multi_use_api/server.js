const express = require('express');
const subdomainMiddleware = require('./middleware/subdomainMiddleware');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = 3005;
app.use(cors()); // Allow all origins
// Middleware to parse JSON request bodies
app.use(express.json());

// Middleware to parse URL-encoded request bodies (if needed)
app.use(express.urlencoded({ extended: true }));

// Middleware to parse subdomains
app.use(subdomainMiddleware);

// Subdomain-specific routes
app.use((req, res, next) => {
  if (req.clientDir) {
    const routesDir = path.join(req.clientDir, 'src', 'routes');
    console.log(`Loading routes for client from: ${routesDir}`);

    if (fs.existsSync(routesDir)) {
      fs.readdirSync(routesDir).forEach((file) => {
        const routePath = path.join(routesDir, file);
        const route = require(routePath);
        const routeName = file.replace('.js', ''); // Use file name as route name
        console.log(`Registering route: /api/${routeName} for client`);
        app.use(`/api/${routeName}`, route);
      });
    } else {
      console.error(`Routes directory not found for client: ${req.clientName}`);
    }
    next();
  } else {
    next(); // No subdomain, proceed to global routes
  }
});

// Global server routes
const globalRoutesDir = path.join(__dirname, 'src', 'routes');
console.log(`Loading global routes from: ${globalRoutesDir}`);

if (fs.existsSync(globalRoutesDir)) {
  fs.readdirSync(globalRoutesDir).forEach((file) => {
    const routePath = path.join(globalRoutesDir, file);
    const route = require(routePath);
    const routeName = file.replace('.js', ''); // Use file name as route name
    console.log(`Registering global route: /api/${routeName}`);
    app.use(`/api/${routeName}`, route);
  });
}

// Default route for main domain
app.get('/', (req, res) => {
  res.send('Welcome to the Global Server');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
