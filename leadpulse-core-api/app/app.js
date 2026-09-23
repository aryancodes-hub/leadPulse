const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const registerRoutes = require('./configs/route-config');
const errorHandler = require('./middleware/error-handler');

const app = express();

// Security and utility middlewares
app.use(helmet());
app.use(cors({ credentials: true,  origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());
app.use(cookieParser());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'core-api' });
});

// Register all API routes centrally
registerRoutes(app);

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Endpoint not found' } });
});

// Global Error Handler (must be last)
app.use(errorHandler);

module.exports = app;
