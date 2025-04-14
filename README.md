# Task Manager

A personal task manager application with Pomodoro timer, task history tracking, and productivity analytics.

## Overview

This project implements a comprehensive task management system with the following key features:

- **Task Priority Management**: Organize tasks by urgency/importance
- **Pomodoro Timer**: Built-in 25/5 minute work/break cycle
- **Task History**: Track completed and failed tasks over time
- **Time Tracking**: Compare estimated vs. actual time spent on tasks
- **Persistence**: Save all data to a SQLite database
- **Containerization**: Packaged as a Docker container for easy deployment

## Technology Stack

- **Frontend**: React.js with Tailwind CSS
- **Backend**: Node.js with Express
- **Database**: SQLite
- **Containerization**: Docker
- **CI/CD**: GitHub Actions

## Project Structure

The project is organized into the following main directories:

```
task-manager/
├── backend/         # Node.js/Express backend
├── frontend/        # React.js frontend
├── docker/          # Docker configuration files
└── .github/         # GitHub Actions workflows
```

## Getting Started

### Prerequisites

- Docker and Docker Compose

### Running with Docker

The easiest way to run the application is using Docker Compose:

```bash
cd task-manager/docker
docker-compose up -d
```

This will:
- Build and start the backend container on port 5000
- Build and start the frontend container on port 3001
- Set up volume mapping for persistent data storage

You can then access the application at `http://localhost:3001`

To stop the containers:

```bash
docker-compose down
```

### Manual Development Setup (Alternative)

If you prefer to run the application without Docker:

1. Start the backend server:
   ```bash
   cd task-manager/backend
   npm install
   npm run dev
   ```

2. Start the frontend development server:
   ```bash
   cd task-manager/frontend
   npm install
   npm start
   ```

3. Access the application at `http://localhost:3001`

## Features

### Task Management

- Create, update, and delete tasks
- Organize tasks by priority (urgent, high, medium, low)
- Track estimated and actual time spent on tasks
- Mark tasks as completed

### Pomodoro Timer

- 25-minute focus sessions followed by 5-minute breaks
- Associate timer sessions with specific tasks
- Track completed pomodoro sessions

### Analytics Dashboard

- View task completion statistics
- Analyze productivity trends
- Compare estimated vs. actual time spent

## API Endpoints

The backend provides the following API endpoints:

### User Management
- `GET /api/user` - Returns the current user info
- `POST /api/user` - Creates a new user or returns existing user

### Task Management
- `GET /api/tasks` - Returns all tasks for the current day
- `GET /api/tasks/history` - Returns task history for a date range
- `POST /api/tasks` - Creates a new task
- `PUT /api/tasks/:id` - Updates a task (including marking as complete)
- `DELETE /api/tasks/:id` - Deletes a task
- `GET /api/tasks/stats` - Returns completion statistics for the specified period

### Pomodoro Management
- `POST /api/pomodoro/start` - Starts a new pomodoro session
- `PUT /api/pomodoro/:id/complete` - Marks a pomodoro session as complete
- `GET /api/pomodoro/history` - Gets pomodoro history for a specific day