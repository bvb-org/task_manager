# Task Manager Implementation Guide

## Project Overview

This document provides implementation instructions for a personal task manager application with the following key features:

1. **Task Priority Management**: Organize tasks by urgency/importance
2. **Pomodoro Timer**: Built-in 25/5 minute work/break cycle
3. **Task History**: Track completed and failed tasks over time
4. **Time Tracking**: Compare estimated vs. actual time spent on tasks
5. **Persistence**: Save all data to a database
6. **Containerization**: Package as a Docker container for Raspberry Pi deployment
7. **CI/CD**: GitHub Actions workflow for automatic deployment

The application will help the user maintain accountability by showing tasks that weren't completed and tracking completion percentages over time, addressing the challenge of prioritizing necessary tasks over more enjoyable ones.

## Technology Stack

- **Frontend**: React.js
- **Backend**: Node.js with Express
- **Database**: SQLite (for simplicity, can be upgraded to PostgreSQL if needed)
- **Containerization**: Docker
- **CI/CD**: GitHub Actions
- **Hosting**: Raspberry Pi

## Database Schema

```sql
-- Users table (for potential multi-user support)
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  text TEXT NOT NULL,
  priority TEXT NOT NULL, -- 'urgent', 'high', 'medium', 'low'
  estimated_time INTEGER NOT NULL, -- in minutes
  actual_time INTEGER DEFAULT 0, -- in minutes
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  due_date TIMESTAMP,
  completed BOOLEAN DEFAULT 0,
  completed_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Task History table
CREATE TABLE task_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD format
  status TEXT NOT NULL, -- 'completed', 'failed', 'in_progress'
  FOREIGN KEY (task_id) REFERENCES tasks(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Pomodoro Sessions table
CREATE TABLE pomodoro_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER,
  user_id INTEGER NOT NULL,
  duration INTEGER NOT NULL, -- in seconds
  type TEXT NOT NULL, -- 'focus' or 'break'
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed BOOLEAN DEFAULT 0,
  FOREIGN KEY (task_id) REFERENCES tasks(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Backend API Implementation

Create a Node.js/Express backend with the following endpoints:

### User Management

```javascript
// GET /api/user
// Returns the current user info

// POST /api/user
// Creates a new user or returns existing user
```

### Task Management

```javascript
// GET /api/tasks
// Returns all tasks for the current day

// GET /api/tasks/history?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// Returns task history for a date range

// POST /api/tasks
// Creates a new task

// PUT /api/tasks/:id
// Updates a task (including marking as complete)

// DELETE /api/tasks/:id
// Deletes a task

// GET /api/tasks/stats?period=day|week|month
// Returns completion statistics for the specified period
```

### Pomodoro Management

```javascript
// POST /api/pomodoro/start
// Starts a new pomodoro session

// PUT /api/pomodoro/:id/complete
// Marks a pomodoro session as complete

// GET /api/pomodoro/history?date=YYYY-MM-DD
// Gets pomodoro history for a specific day
```

## Frontend Implementation

Modify and expand the existing React component to include:

1. **Task History View**: 
   - Add a calendar view to see tasks by day
   - Implement a weekly overview showing completion rates
   - Show both completed and uncompleted tasks for past days

2. **Time Tracking**:
   - Add actual time tracking to each task
   - Show comparison between estimated and actual time
   - Display time efficiency metrics

3. **Persistence**:
   - Add API calls to save/load data from the backend
   - Implement local storage as backup for offline usage

4. **Authentication** (optional):
   - Simple login system if multiple people will use it

## Implementation Steps

### 1. Set Up Project Structure

```
task-manager/
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── app.js
│   │   └── db.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── .env
├── .github/
│   └── workflows/
│       └── deploy.yml
└── README.md
```

### 2. Backend Implementation

1. Initialize Node.js application in the backend directory:
```bash
cd backend
npm init -y
npm install express sqlite3 cors morgan dotenv helmet moment
npm install --save-dev nodemon
```

2. Set up Express app with middleware in `app.js`:
```javascript
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Routes
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/user', require('./routes/users'));
app.use('/api/pomodoro', require('./routes/pomodoro'));

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/build/index.html'));
  });
}

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
```

3. Create database connection in `db.js`:
```javascript
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../data/taskmanager.db');
const dbDir = path.dirname(dbPath);

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Could not connect to database', err);
  } else {
    console.log('Connected to SQLite database');
    initDb();
  }
});

function initDb() {
  // Create tables if they don't exist
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        text TEXT NOT NULL,
        priority TEXT NOT NULL,
        estimated_time INTEGER NOT NULL,
        actual_time INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        due_date TIMESTAMP,
        completed BOOLEAN DEFAULT 0,
        completed_at TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS task_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        status TEXT NOT NULL,
        FOREIGN KEY (task_id) REFERENCES tasks(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS pomodoro_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER,
        user_id INTEGER NOT NULL,
        duration INTEGER NOT NULL,
        type TEXT NOT NULL,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed BOOLEAN DEFAULT 0,
        FOREIGN KEY (task_id) REFERENCES tasks(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    
    // Create default user if none exists
    db.get(`SELECT id FROM users LIMIT 1`, [], (err, row) => {
      if (!err && !row) {
        db.run(`INSERT INTO users (username) VALUES (?)`, ['default']);
      }
    });
  });
}

module.exports = db;
```

4. Implement controllers for tasks, users, and pomodoro sessions

### 3. Frontend Implementation

1. Set up React frontend:
```bash
cd frontend
npm install axios moment react-router-dom recharts tailwindcss
```

2. Expand the existing Task Manager component with history functionality

### 4. Docker Configuration

Create Dockerfile in the docker directory:
```dockerfile
FROM node:16-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM node:16-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --production
COPY backend/ ./
COPY --from=frontend-builder /app/frontend/build ./public
VOLUME /app/data
EXPOSE 5000
CMD ["node", "src/app.js"]
```

Create docker-compose.yml:
```yaml
version: '3'
services:
  task-manager:
    build:
      context: ..
      dockerfile: docker/Dockerfile
    ports:
      - "3000:5000"
    volumes:
      - ../data:/app/data
    restart: unless-stopped
```

### 5. GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Raspberry Pi

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v1
      
    - name: Login to GitHub Container Registry
      uses: docker/login-action@v1
      with:
        registry: ghcr.io
        username: ${{ github.repository_owner }}
        password: ${{ secrets.GITHUB_TOKEN }}
        
    - name: Build and push
      uses: docker/build-push-action@v2
      with:
        context: .
        file: ./docker/Dockerfile
        platforms: linux/arm/v7
        push: true
        tags: ghcr.io/${{ github.repository_owner }}/task-manager:latest
        
  deploy:
    needs: build
    runs-on: ubuntu-latest
    
    steps:
    - name: Deploy to Raspberry Pi
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.PI_HOST }}
        username: ${{ secrets.PI_USERNAME }}
        key: ${{ secrets.PI_SSH_KEY }}
        script: |
          docker pull ghcr.io/${{ github.repository_owner }}/task-manager:latest
          docker stop task-manager || true
          docker rm task-manager || true
          docker run -d --name task-manager \
            -p 3000:5000 \
            -v /home/${{ secrets.PI_USERNAME }}/task-manager/data:/app/data \
            --restart unless-stopped \
            ghcr.io/${{ github.repository_owner }}/task-manager:latest
```

## Additional Features to Implement

### 1. Weekly and Monthly Overview

Add a dashboard page that shows:
- Completion rate by day (bar chart)
- Tasks completed vs. failed (pie chart)
- Most productive days/times (heat map)
- Average time spent on tasks by priority

### 2. Task Statistics

For each task category or priority level, show:
- Average completion time vs. estimated time
- Success rate (percentage of tasks completed)
- Procrastination index (how long before due date tasks are completed)

### 3. Motivation System

- Allow setting of rewards for completing certain task thresholds
- Implement a "break the chain" calendar view for habit tracking
- Send notifications for incomplete high-priority tasks

### 4. Integration with External Systems

Optional extensions:
- Calendar integration (Google Calendar, etc.)
- Email/SMS reminders
- Data export for analysis

## Raspberry Pi Setup

1. Install Docker on Raspberry Pi:
```bash
curl -sSL https://get.docker.com | sh
sudo usermod -aG docker ${USER}
```

2. Create data directory:
```bash
mkdir -p ~/task-manager/data
```

3. Manually run the container for the first time (later it will be deployed by GitHub Actions):
```bash
docker run -d --name task-manager \
  -p 3000:5000 \
  -v ~/task-manager/data:/app/data \
  --restart unless-stopped \
  ghcr.io/YOUR_USERNAME/task-manager:latest
```

## Setup GitHub Repository

1. Create a new GitHub repository
2. Add the repository secrets for CI/CD:
   - PI_HOST: IP address of your Raspberry Pi
   - PI_USERNAME: SSH username
   - PI_SSH_KEY: Private SSH key content

## Development Best Practices

1. **Task Persistence**: Autosave tasks when modified to prevent data loss
2. **Error Handling**: Implement robust error handling for API calls
3. **Offline Mode**: Allow basic functionality when offline
4. **Responsive Design**: Ensure the UI works well on mobile devices
5. **Performance**: Optimize for Raspberry Pi's limited resources

## Motivational Enhancements

To address the specific need of staying accountable and completing important but less enjoyable tasks:

1. **Visual Progress**: Emphasize progress bars and completion metrics
2. **Task Dependencies**: Allow marking certain enjoyable tasks (like app development) as "unlockable" only after completing necessary tasks
3. **Streak System**: Build a "don't break the chain" visualization for completing all high-priority tasks each day
4. **Time Balance**: Track time spent on "have to do" vs. "want to do" tasks to encourage balance
5. **Weekly Review**: Implement a weekly report highlighting accomplishments and areas for improvement

Remember to focus on the core functionality first and add these motivational features incrementally as the basic system becomes stable.
