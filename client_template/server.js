const express = require('express');
const getClientDbConfig = require('./db'); // Dynamic database loader
const http = require('http');
const socketIo = require('socket.io');
const userLoginRoute = require('./src/routes/userLogin');
const billConfig = require('./src/routes/billConfig');
const propertyRoutes = require('./src/routes/propertyRoutes');
const outletRoutes = require('./src/routes/outlet');
const tableRoutes = require('./src/routes/tableconfigs');
const billRoutes = require('./src/routes/billing');
const categoriesRoutes = require('./src/routes/categories');
const dateConfigRoutes = require('./src/routes/dateConfig');
const guestRecordRoutes = require('./src/routes/guestRecord');
const happyHourConfigRoutes = require('./src/routes/happyHourConfig');
const itemRoutes = require('./src/routes/item');
const inventoryRoutes = require('./src/routes/inventory');
const kotconfigsRoutes = require('./src/routes/kotConfig');
const ordersRoutes = require('./src/routes/order');
const paymentRoutes = require('./src/routes/payments');
const printerRoutes = require('./src/routes/printers');
const reservationRoutes = require('./src/routes/reservation');
const servicechargeRoutes = require('./src/routes/servicecharge_config');
const subcategoriesRoutes = require('./src/routes/subcategories');
const taxconfigRoutes = require('./src/routes/tax_config');
const userpermissionsRoutes = require('./src/routes/user_permissions');
const waitersRoutes = require('./src/routes/waiterMaster');
const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3005;

// Initialize Socket.io with CORS configuration
const io = socketIo(server, {
  cors: {
    origin: "http://172.21.183.113:3000", // Replace with your Flutter app's URL
    methods: ["GET", "POST"],
  },
});

// Middleware for JSON parsing
app.use(express.json());

// Middleware to dynamically configure the database
app.use((req, res, next) => {
  const subdomain = req.hostname.split('.')[0]; // Extract subdomain
  try {
    const pool = getClientDbConfig(subdomain); // Load database pool dynamically
    req.db = pool;

    // Initialize notifications for the client's database
    listenForNotifications(pool);

    next();
  } catch (err) {
    console.error(`Error loading database for subdomain: ${subdomain}`);
    res.status(500).json({ success: false, message: 'Subdomain configuration not found.' });
  }
});

// Listen for PostgreSQL notifications
async function listenForNotifications(pool) {
  try {
    const client = await pool.connect();
    await client.query('LISTEN table_update');
    console.log('Listening for table updates...');

    client.on('notification', (msg) => {
      console.log('Notification received:', msg);
      io.emit('table_update', msg.payload);
    });
  } catch (err) {
    console.error('Error listening for notifications:', err.message);
  }
}

// Socket.io connection to handle real-time notifications
io.on('connection', (socket) => {
  console.log('A client connected');
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Use the routes
app.use('/api/users', userLoginRoute);
app.use('/api/bill-config', billConfig);
app.use('/api/properties', propertyRoutes);
app.use('/api', outletRoutes);
app.use('/api/table-config', tableRoutes);
app.use('/api/bill', billRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/date_config', dateConfigRoutes);
app.use('/api/guest_record', guestRecordRoutes);
app.use('/api/happy-hour-config', happyHourConfigRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/kotconfigs', kotconfigsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/printer', printerRoutes);
app.use('/api/reservation', reservationRoutes);
app.use('/api/servicecharge', servicechargeRoutes);
app.use('/api/subcategories', subcategoriesRoutes);
app.use('/api/taxconfig', taxconfigRoutes);
app.use('/api/userpermissions', userpermissionsRoutes);
app.use('/api/waiters', waitersRoutes);


// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the Client Point of Sale System API!');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Start the server
// Start the server
server.listen(PORT, () => {
  const address = server.address();
  const hostname = require('os').hostname();
  const protocol = "http";

  console.log(`Client server running at ${protocol}://${hostname}:${address.port}`);
});
