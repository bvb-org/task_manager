const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/user
// Returns the current user info (for now, just returns the default user)
router.get('/', (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get('default');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error('Error getting user:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/user
// Creates a new user or returns existing user
router.post('/', (req, res) => {
  const { username } = req.body;
  
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }
  
  try {
    // Check if user exists
    const existingUser = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    
    if (existingUser) {
      // User exists, return it
      return res.json(existingUser);
    }
    
    // Create new user
    const insert = db.prepare('INSERT INTO users (username) VALUES (?)');
    const result = insert.run(username);
    
    // Return the newly created user
    const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newUser);
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;