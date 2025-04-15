const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// JWT Secret - should be in environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    req.user = user;
    next();
  });
};

// GET /api/user
// Returns the current user info (requires authentication)
router.get('/', authenticateToken, (req, res) => {
  // Explicitly set content type to ensure JSON response
  res.setHeader('Content-Type', 'application/json');
  
  try {
    console.log(`Getting user info for ID: ${req.user?.id}`);
    
    if (!req.user || !req.user.id) {
      console.log('User info request failed: No authenticated user');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const user = db.prepare('SELECT id, username, email, created_at FROM users WHERE id = ?').get(req.user.id);
    
    if (!user) {
      console.log(`User info request failed: User not found for ID ${req.user.id}`);
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log(`User info retrieved successfully for: ${user.username} (ID: ${user.id})`);
    return res.status(200).json(user);
  } catch (err) {
    console.error('Error getting user:', err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/user/register
// Register a new user
router.post('/register', async (req, res) => {
  // Explicitly set content type to ensure JSON response
  res.setHeader('Content-Type', 'application/json');
  
  const { username, email, password } = req.body;
  
  console.log(`Registration attempt for user: ${email}`);
  console.log('Request body:', req.body);
  
  if (!username || !email || !password) {
    console.log('Registration failed: Missing required fields');
    return res.status(400).json({ error: 'Username, email and password are required' });
  }
  
  try {
    // Check if user exists
    const existingUser = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(username, email);
    
    if (existingUser) {
      console.log(`Registration failed: Username or email already exists for ${email}`);
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const insert = db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)');
    const result = insert.run(username, email, hashedPassword);
    
    // Return the newly created user (without password)
    const newUser = db.prepare('SELECT id, username, email, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
    
    // Generate JWT token
    const token = jwt.sign({ id: newUser.id, username: newUser.username }, JWT_SECRET, { expiresIn: '7d' });
    
    console.log(`User registered successfully: ${username} (ID: ${newUser.id})`);
    
    // Create response object
    const responseData = { user: newUser, token };
    console.log('Sending registration response:', responseData);
    
    // Send JSON response with explicit content type
    return res.status(201).json(responseData);
  } catch (err) {
    console.error(`Error creating user ${email}:`, err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/user/login
// Login a user
router.post('/login', async (req, res) => {
  // Explicitly set content type to ensure JSON response
  res.setHeader('Content-Type', 'application/json');
  
  const { email, password } = req.body;
  
  console.log(`Login attempt for user: ${email}`);
  console.log('Login request body:', req.body);
  
  if (!email || !password) {
    console.log('Login failed: Missing required fields');
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  try {
    // Find user by email
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    
    if (!user) {
      console.log(`Login failed: User not found for email ${email}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log(`Login failed: Invalid password for user ${email}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Generate JWT token
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    
    // Return user info (without password) and token
    const userInfo = {
      id: user.id,
      username: user.username,
      email: user.email,
      created_at: user.created_at
    };
    
    console.log(`User logged in successfully: ${user.username} (ID: ${user.id})`);
    
    // Create response object
    const responseData = { user: userInfo, token };
    console.log('Sending login response:', responseData);
    
    // Send JSON response with explicit content type
    return res.status(200).json(responseData);
  } catch (err) {
    console.error(`Error logging in user ${email}:`, err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/user
// Creates a new user or returns existing user (legacy endpoint)
router.post('/', (req, res) => {
  // Explicitly set content type to ensure JSON response
  res.setHeader('Content-Type', 'application/json');
  
  const { username } = req.body;
  
  console.log('Legacy user creation attempt for:', username);
  console.log('Request body:', req.body);
  
  if (!username) {
    console.log('Legacy user creation failed: Missing username');
    return res.status(400).json({ error: 'Username is required' });
  }
  
  try {
    // Check if user exists
    const existingUser = db.prepare('SELECT id, username, email, created_at FROM users WHERE username = ?').get(username);
    
    if (existingUser) {
      // User exists, return it
      console.log(`Legacy user already exists: ${username} (ID: ${existingUser.id})`);
      return res.status(200).json(existingUser);
    }
    
    // Create new user
    const insert = db.prepare('INSERT INTO users (username) VALUES (?)');
    const result = insert.run(username);
    
    // Return the newly created user
    const newUser = db.prepare('SELECT id, username, email, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
    console.log(`Legacy user created successfully: ${username} (ID: ${newUser.id})`);
    
    return res.status(201).json(newUser);
  } catch (err) {
    console.error('Error creating legacy user:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;