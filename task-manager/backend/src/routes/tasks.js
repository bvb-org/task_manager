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

// GET /api/tasks
// Returns all tasks for the current day
router.get('/', (req, res) => {
  try {
    const userId = getUserId();
    
    const today = moment().format('YYYY-MM-DD');
    const startOfDay = moment(today).startOf('day').toISOString();
    const endOfDay = moment(today).endOf('day').toISOString();
    
    const tasks = db.prepare(`
      SELECT * FROM tasks
      WHERE user_id = ?
      AND (due_date IS NULL OR (due_date >= ? AND due_date <= ?))
      ORDER BY priority ASC, created_at ASC
    `).all(userId, startOfDay, endOfDay);
    
    res.json(tasks);
  } catch (err) {
    console.error('Error getting tasks:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tasks/history
// Returns task history for a date range
router.get('/history', (req, res) => {
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'Start date and end date are required' });
  }
  
  try {
    const userId = getUserId();
    
    const history = db.prepare(`
      SELECT th.*, t.text, t.priority, t.estimated_time, t.actual_time
      FROM task_history th
      JOIN tasks t ON th.task_id = t.id
      WHERE th.user_id = ? AND th.date >= ? AND th.date <= ?
      ORDER BY th.date DESC
    `).all(userId, startDate, endDate);
    
    res.json(history);
  } catch (err) {
    console.error('Error getting task history:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks
// Creates a new task
router.post('/', (req, res) => {
  const { text, priority, estimated_time, due_date } = req.body;
  
  if (!text || !priority || !estimated_time) {
    return res.status(400).json({ error: 'Text, priority, and estimated time are required' });
  }
  
  try {
    const userId = getUserId();
    
    // Use a transaction to ensure both operations succeed or fail together
    const task = db.transaction(() => {
      // Insert the task
      const insertTask = db.prepare(`
        INSERT INTO tasks (user_id, text, priority, estimated_time, due_date)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      const result = insertTask.run(userId, text, priority, estimated_time, due_date);
      const taskId = result.lastInsertRowid;
      
      // Get the newly created task
      const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
      
      // Add to task history as 'in_progress'
      const today = moment().format('YYYY-MM-DD');
      const insertHistory = db.prepare(`
        INSERT INTO task_history (task_id, user_id, date, status)
        VALUES (?, ?, ?, ?)
      `);
      
      insertHistory.run(task.id, userId, today, 'in_progress');
      
      return task;
    })();
    
    // Return the task from the transaction
    res.status(201).json(task);
    res.status(201).json(newTask);
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/tasks/:id
// Updates a task (including marking as complete)
router.put('/:id', (req, res) => {
  const taskId = req.params.id;
  const { text, priority, estimated_time, actual_time, completed, due_date } = req.body;
  
  getUserId((err, userId) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // First, check if the task exists and belongs to the user
    db.get('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [taskId, userId], (err, task) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      
      // Prepare update fields
      const updates = [];
      const params = [];
      
      if (text !== undefined) {
        updates.push('text = ?');
        params.push(text);
      }
      
      if (priority !== undefined) {
        updates.push('priority = ?');
        params.push(priority);
      }
      
      if (estimated_time !== undefined) {
        updates.push('estimated_time = ?');
        params.push(estimated_time);
      }
      
      if (actual_time !== undefined) {
        updates.push('actual_time = ?');
        params.push(actual_time);
      }
      
      if (due_date !== undefined) {
        updates.push('due_date = ?');
        params.push(due_date);
      }
      
      // Handle completion status change
      const wasCompleted = task.completed === 1;
      const isNowCompleted = completed === true;
      
      if (completed !== undefined) {
        updates.push('completed = ?');
        params.push(completed ? 1 : 0);
        
        if (!wasCompleted && isNowCompleted) {
          updates.push('completed_at = ?');
          params.push(moment().toISOString());
        } else if (wasCompleted && !isNowCompleted) {
          updates.push('completed_at = NULL');
        }
      }
      
      // Add task ID and user ID to params
      params.push(taskId);
      params.push(userId);
      
      // Update the task
      db.run(
        `UPDATE tasks SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
        params,
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          // If completion status changed, update task history
          if (completed !== undefined && wasCompleted !== isNowCompleted) {
            const today = moment().format('YYYY-MM-DD');
            const status = isNowCompleted ? 'completed' : 'in_progress';
            
            db.run(
              `INSERT INTO task_history (task_id, user_id, date, status)
               VALUES (?, ?, ?, ?)`,
              [taskId, userId, today, status],
              (err) => {
                if (err) {
                  console.error('Error updating task history:', err);
                }
              }
            );
          }
          
          // Return the updated task
          db.get('SELECT * FROM tasks WHERE id = ?', [taskId], (err, updatedTask) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            res.json(updatedTask);
          });
        }
      );
    });
  });
});

// DELETE /api/tasks/:id
// Deletes a task
router.delete('/:id', (req, res) => {
  const taskId = req.params.id;
  
  getUserId((err, userId) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // First, check if the task exists and belongs to the user
    db.get('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [taskId, userId], (err, task) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      
      // Delete related records in task_history
      db.run('DELETE FROM task_history WHERE task_id = ?', [taskId], (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        // Delete related records in pomodoro_sessions
        db.run('DELETE FROM pomodoro_sessions WHERE task_id = ?', [taskId], (err) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          // Delete the task
          db.run('DELETE FROM tasks WHERE id = ? AND user_id = ?', [taskId, userId], function(err) {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            
            if (this.changes === 0) {
              return res.status(404).json({ error: 'Task not found' });
            }
            
            res.json({ message: 'Task deleted successfully' });
          });
        });
      });
    });
  });
});

// GET /api/tasks/stats
// Returns completion statistics for the specified period
router.get('/stats', (req, res) => {
  const { period } = req.query;
  
  if (!period || !['day', 'week', 'month'].includes(period)) {
    return res.status(400).json({ error: 'Valid period (day, week, month) is required' });
  }
  
  getUserId((err, userId) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    let startDate;
    const endDate = moment().format('YYYY-MM-DD');
    
    switch (period) {
      case 'day':
        startDate = moment().format('YYYY-MM-DD');
        break;
      case 'week':
        startDate = moment().subtract(6, 'days').format('YYYY-MM-DD');
        break;
      case 'month':
        startDate = moment().subtract(29, 'days').format('YYYY-MM-DD');
        break;
    }
    
    db.all(
      `SELECT date, status, COUNT(*) as count
       FROM task_history
       WHERE user_id = ? AND date >= ? AND date <= ?
       GROUP BY date, status
       ORDER BY date ASC`,
      [userId, startDate, endDate],
      (err, stats) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        // Process stats to create a more usable format
        const result = {
          dates: [],
          completed: [],
          failed: [],
          inProgress: [],
          completionRate: []
        };
        
        // Get unique dates
        const uniqueDates = [...new Set(stats.map(item => item.date))];
        result.dates = uniqueDates;
        
        // For each date, calculate stats
        uniqueDates.forEach(date => {
          const dayStats = stats.filter(item => item.date === date);
          
          const completed = dayStats.find(item => item.status === 'completed')?.count || 0;
          const failed = dayStats.find(item => item.status === 'failed')?.count || 0;
          const inProgress = dayStats.find(item => item.status === 'in_progress')?.count || 0;
          
          const total = completed + failed + inProgress;
          const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
          
          result.completed.push(completed);
          result.failed.push(failed);
          result.inProgress.push(inProgress);
          result.completionRate.push(completionRate);
        });
        
        res.json(result);
      }
    );
  });
});

module.exports = router;