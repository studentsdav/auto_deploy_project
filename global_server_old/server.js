const express = require('express');
const cors = require('cors');
const propertyRoutes = require('./src/routes/propertyRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');

const app = express();

const PORT = 3000;
const HOST = 'localhost'; // Replace with the specific IP address you want to bind

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/properties', propertyRoutes);
app.use('/api/review', reviewRoutes);

app.get('/', (req, res) => {
  res.send('Welcome to the restricted Global Server!');
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).send('Route not found!');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Start the server
app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
