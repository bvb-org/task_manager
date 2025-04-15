const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// JWT Secret - should be in environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const app = express();
// Middleware

// Disable CORS entirely for debugging
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
});

// Configure CORS middleware (this is now redundant but kept for safety)
app.use(cors({
  origin: true, // Allow any origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Use helmet with CORS-friendly settings
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Log all requests
app.use(morgan('combined'));

// Parse JSON request bodies
app.use(express.json());

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // Track original response methods
  const originalSend = res.send;
  const originalJson = res.json;
  
  // Override res.send to log response data
  res.send = function(body) {
    console.log(`Response for ${req.method} ${req.url} - Status: ${res.statusCode}`);
    if (typeof body === 'string' && body.startsWith('<!DOCTYPE html>')) {
      console.warn('WARNING: HTML response detected for API request');
    }
    return originalSend.apply(res, arguments);
  };
  
  // Override res.json to log response data
  res.json = function(body) {
    console.log(`JSON Response for ${req.method} ${req.url} - Status: ${res.statusCode}`);
    return originalJson.apply(res, arguments);
  };
  
  next();
});
app.use(express.json());

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    console.log(`No auth token provided for ${req.method} ${req.path}`);
    req.user = null;
    return next();
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log(`Invalid token for ${req.method} ${req.path}: ${err.message}`);
      req.user = null;
    } else {
      console.log(`Authenticated user ${user.username} (ID: ${user.id}) for ${req.method} ${req.path}`);
      req.user = user;
    }
    next();
  });
};

// Apply authentication middleware to all requests
app.use(authenticateToken);

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('Health check request received');
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Routes
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/user', require('./routes/users'));
app.use('/api/pomodoro', require('./routes/pomodoro'));

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  // Make sure API routes are handled before the catch-all route
  app.use(express.static(path.join(__dirname, '../../frontend/build')));
  
  // Only apply the catch-all route to non-API requests
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api/') || req.path === '/health') {
      return next();
    }
    res.sendFile(path.join(__dirname, '../../frontend/build/index.html'));
  });
}

// Error handling
app.use((err, req, res, next) => {
  console.error(`Server error for ${req.method} ${req.path}:`, err.stack);
  
  // Make sure we're sending a JSON response for API requests
  if (req.path.startsWith('/api/') || req.path === '/health') {
    // Set content type explicitly to ensure JSON response
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: err.message });
  }
  
  // For non-API requests, we can send HTML error page if needed
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('Authentication is enabled');
});

module.exports = app;