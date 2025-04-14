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
  
  getUserId((err, userId) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // If task_id is provided, verify it exists and belongs to the user
    if (task_id) {
      db.get('SELECT id FROM tasks WHERE id = ? AND user_id = ?', [task_id, userId], (err, task) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        if (!task) {
          return res.status(404).json({ error: 'Task not found' });
        }
        
        createPomodoroSession(userId, task_id, duration, type, res);
      });
    } else {
      createPomodoroSession(userId, null, duration, type, res);
    }
  });
});

// Helper function to create a pomodoro session
function createPomodoroSession(userId, taskId, duration, type, res) {
  db.run(
    `INSERT INTO pomodoro_sessions (user_id, task_id, duration, type)
     VALUES (?, ?, ?, ?)`,
    [userId, taskId, duration, type],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Return the newly created session
      db.get('SELECT * FROM pomodoro_sessions WHERE id = ?', [this.lastID], (err, session) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.status(201).json(session);
      });
    }
  );
}

// PUT /api/pomodoro/:id/complete
// Marks a pomodoro session as complete
router.put('/:id/complete', (req, res) => {
  const sessionId = req.params.id;
  
  getUserId((err, userId) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // First, check if the session exists and belongs to the user
    db.get('SELECT * FROM pomodoro_sessions WHERE id = ? AND user_id = ?', [sessionId, userId], (err, session) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!session) {
        return res.status(404).json({ error: 'Pomodoro session not found' });
      }
      
      // Update the session to completed
      db.run(
        'UPDATE pomodoro_sessions SET completed = 1 WHERE id = ?',
        [sessionId],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          // If this was a focus session and associated with a task, update the task's actual time
          if (session.type === 'focus' && session.task_id) {
            db.get('SELECT actual_time FROM tasks WHERE id = ?', [session.task_id], (err, task) => {
              if (err || !task) {
                console.error('Error getting task:', err);
                return res.json({ ...session, completed: 1 });
              }
              
              // Convert seconds to minutes and add to actual time
              const additionalMinutes = Math.ceil(session.duration / 60);
              const newActualTime = task.actual_time + additionalMinutes;
              
              db.run(
                'UPDATE tasks SET actual_time = ? WHERE id = ?',
                [newActualTime, session.task_id],
                (err) => {
                  if (err) {
                    console.error('Error updating task actual time:', err);
                  }
                  
                  // Return the updated session
                  res.json({ ...session, completed: 1 });
                }
              );
            });
          } else {
            // Return the updated session
            res.json({ ...session, completed: 1 });
          }
        }
      );
    });
  });
});

// GET /api/pomodoro/history
// Gets pomodoro history for a specific day
router.get('/history', (req, res) => {
  const { date } = req.query;
  
  if (!date) {
    return res.status(400).json({ error: 'Date is required (YYYY-MM-DD format)' });
  }
  
  getUserId((err, userId) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const startOfDay = moment(date).startOf('day').toISOString();
    const endOfDay = moment(date).endOf('day').toISOString();
    
    db.all(
      `SELECT ps.*, t.text as task_text 
       FROM pomodoro_sessions ps
       LEFT JOIN tasks t ON ps.task_id = t.id
       WHERE ps.user_id = ? AND ps.started_at >= ? AND ps.started_at <= ?
       ORDER BY ps.started_at DESC`,
      [userId, startOfDay, endOfDay],
      (err, sessions) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
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
      }
    );
  });
});

module.exports = router;