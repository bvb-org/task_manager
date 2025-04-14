const express = require('express');
const router = express.Router();
const db = require('../db');
const moment = require('moment');

// Helper function to get user ID (for now, just returns the default user)
const getUserId = () => {
  try {
    const user = db.prepare('SELECT id FROM users WHERE username = ?').get('default');
    if (!user) {
      throw new Error('User not found');
    }
    return user.id;
  } catch (err) {
    throw err;
  }
};

// POST /api/pomodoro/start
// Starts a new pomodoro session
router.post('/start', (req, res) => {
  const { task_id, duration, type } = req.body;
  
  if (!duration || !type || !['focus', 'break'].includes(type)) {
    return res.status(400).json({ error: 'Duration and valid type (focus or break) are required' });
  }
  
  try {
    const userId = getUserId();
    
    // If task_id is provided, verify it exists and belongs to the user
    if (task_id) {
      const task = db.prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?').get(task_id, userId);
      
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
    }
    
    // Create the pomodoro session
    const insertStmt = db.prepare(`
      INSERT INTO pomodoro_sessions (user_id, task_id, duration, type)
      VALUES (?, ?, ?, ?)
    `);
    
    const result = insertStmt.run(userId, task_id, duration, type);
    
    // Return the newly created session
    const session = db.prepare('SELECT * FROM pomodoro_sessions WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(session);
  } catch (err) {
    console.error('Error creating pomodoro session:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/pomodoro/:id/complete
// Marks a pomodoro session as complete
router.put('/:id/complete', (req, res) => {
  const sessionId = req.params.id;
  
  try {
    const userId = getUserId();
    
    // First, check if the session exists and belongs to the user
    const session = db.prepare('SELECT * FROM pomodoro_sessions WHERE id = ? AND user_id = ?').get(sessionId, userId);
    
    if (!session) {
      return res.status(404).json({ error: 'Pomodoro session not found' });
    }
    
    // Update the session to completed
    db.prepare('UPDATE pomodoro_sessions SET completed = 1 WHERE id = ?').run(sessionId);
    
    // If this was a focus session and associated with a task, update the task's actual time
    if (session.type === 'focus' && session.task_id) {
      try {
        const task = db.prepare('SELECT actual_time FROM tasks WHERE id = ?').get(session.task_id);
        
        if (task) {
          // Convert seconds to minutes and add to actual time
          const additionalMinutes = Math.ceil(session.duration / 60);
          const newActualTime = task.actual_time + additionalMinutes;
          
          db.prepare('UPDATE tasks SET actual_time = ? WHERE id = ?').run(newActualTime, session.task_id);
        }
      } catch (taskErr) {
        console.error('Error updating task actual time:', taskErr);
        // Continue even if task update fails
      }
    }
    
    // Return the updated session
    res.json({ ...session, completed: 1 });
  } catch (err) {
    console.error('Error completing pomodoro session:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/pomodoro/history
// Gets pomodoro history for a specific day
router.get('/history', (req, res) => {
  const { date } = req.query;
  
  if (!date) {
    return res.status(400).json({ error: 'Date is required (YYYY-MM-DD format)' });
  }
  
  try {
    const userId = getUserId();
    
    const startOfDay = moment(date).startOf('day').toISOString();
    const endOfDay = moment(date).endOf('day').toISOString();
    
    const sessions = db.prepare(`
      SELECT ps.*, t.text as task_text
      FROM pomodoro_sessions ps
      LEFT JOIN tasks t ON ps.task_id = t.id
      WHERE ps.user_id = ? AND ps.started_at >= ? AND ps.started_at <= ?
      ORDER BY ps.started_at DESC
    `).all(userId, startOfDay, endOfDay);
    
    // Calculate statistics
    const focusSessions = sessions.filter(s => s.type === 'focus');
    const breakSessions = sessions.filter(s => s.type === 'break');
    
    const totalFocusTime = focusSessions.reduce((sum, s) => sum + s.duration, 0);
    const totalBreakTime = breakSessions.reduce((sum, s) => sum + s.duration, 0);
    const completedFocusSessions = focusSessions.filter(s => s.completed === 1).length;
    
    const stats = {
      totalSessions: sessions.length,
      focusSessions: focusSessions.length,
      breakSessions: breakSessions.length,
      completedFocusSessions,
      totalFocusTimeSeconds: totalFocusTime,
      totalBreakTimeSeconds: totalBreakTime,
      completionRate: focusSessions.length > 0
        ? Math.round((completedFocusSessions / focusSessions.length) * 100)
        : 0
    };
    
    res.json({
      sessions,
      stats
    });
  } catch (err) {
    console.error('Error getting pomodoro history:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;