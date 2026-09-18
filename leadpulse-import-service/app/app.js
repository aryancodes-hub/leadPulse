const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const errorHandler = require('./middleware/error-handler');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'leadpulse-import-service' });
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
