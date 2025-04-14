# Task Manager

A personal task manager application with Pomodoro timer, task history tracking, and productivity analytics.

## Features

- **Task Priority Management**: Organize tasks by urgency/importance
- **Pomodoro Timer**: Built-in 25/5 minute work/break cycle
- **Task History**: Track completed and failed tasks over time
- **Time Tracking**: Compare estimated vs. actual time spent on tasks
- **Persistence**: Save all data to a SQLite database
- **Containerization**: Packaged as a Docker container for easy deployment
- **CI/CD**: GitHub Actions workflow for automatic deployment

## Technology Stack

- **Frontend**: React.js with Tailwind CSS
- **Backend**: Node.js with Express
- **Database**: SQLite
- **Containerization**: Docker
- **CI/CD**: GitHub Actions

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Docker (optional, for containerized deployment)

### Local Development Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd task-manager
   ```

2. Set up the backend:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

3. Set up the frontend (in a new terminal):
   ```bash
   cd frontend
   npm install
   npm start
   ```

4. Open your browser and navigate to `http://localhost:3000`

### Docker Deployment

1. Build and run using Docker Compose:
   ```bash
   cd docker
   docker-compose up -d
   ```

2. Access the application at `http://localhost:3000`

## Project Structure

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

## API Endpoints

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

## Deployment to Raspberry Pi

### Prerequisites
- Raspberry Pi with Docker installed
- GitHub repository with the following secrets configured:
  - `PI_HOST`: IP address of your Raspberry Pi
  - `PI_USERNAME`: SSH username
  - `PI_SSH_KEY`: Private SSH key content

### Deployment Process
1. Push changes to the main branch
2. GitHub Actions will automatically:
   - Build the Docker image
   - Push it to GitHub Container Registry
   - Deploy it to your Raspberry Pi

## Development Best Practices

1. **Task Persistence**: Tasks are autosaved when modified to prevent data loss
2. **Error Handling**: Robust error handling for API calls
3. **Responsive Design**: UI works well on mobile devices
4. **Performance**: Optimized for Raspberry Pi's limited resources

## License

This project is licensed under the MIT License - see the LICENSE file for details.