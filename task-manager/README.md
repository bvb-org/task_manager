# Task Manager Application

A full-stack task management application with Pomodoro timer, task history, and dashboard features.

## Features

- User authentication (register, login)
- Task management (create, update, delete tasks)
- Pomodoro timer for focused work sessions
- Task history tracking
- Dashboard with productivity statistics
- Responsive design for mobile and desktop

## Technology Stack

- **Frontend**: React, TailwindCSS, Recharts
- **Backend**: Node.js, Express
- **Database**: SQLite
- **Authentication**: JWT (JSON Web Tokens)
- **Containerization**: Docker

## Deployment Instructions

### Prerequisites

- Docker and Docker Compose installed on your server
- A domain name (optional, for public access)

### Local Deployment

1. Clone the repository:
   ```
   git clone <repository-url>
   cd task-manager
   ```

2. Configure environment variables:
   - Create or modify `.env` files in both `backend` and `frontend` directories
   - Set a strong JWT_SECRET in `backend/.env`

3. Build and start the containers:
   ```
   cd docker
   docker-compose up -d
   ```

4. Access the application:
   - Local: http://localhost (port 80)
   - The backend API is available at http://localhost:5000/api

### Production Deployment

For a production deployment with SSL:

1. Uncomment the Nginx service in `docker-compose.yml`

2. Create an SSL certificate:
   ```
   mkdir -p docker/nginx/ssl
   ```
   
   You can use Let's Encrypt to generate free SSL certificates:
   ```
   certbot certonly --standalone -d yourdomain.com
   ```
   
   Copy the certificates to the nginx/ssl directory:
   ```
   cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem docker/nginx/ssl/
   cp /etc/letsencrypt/live/yourdomain.com/privkey.pem docker/nginx/ssl/
   ```

3. Create an Nginx configuration file:
   ```
   mkdir -p docker/nginx
   touch docker/nginx/nginx.conf
   ```
   
   Add the following configuration:
   ```
   events {
     worker_connections 1024;
   }
   
   http {
     server {
       listen 80;
       server_name yourdomain.com;
       return 301 https://$host$request_uri;
     }
     
     server {
       listen 443 ssl;
       server_name yourdomain.com;
       
       ssl_certificate /etc/nginx/ssl/fullchain.pem;
       ssl_certificate_key /etc/nginx/ssl/privkey.pem;
       
       location / {
         proxy_pass http://frontend:3001;
         proxy_set_header Host $host;
         proxy_set_header X-Real-IP $remote_addr;
       }
       
       location /api {
         proxy_pass http://backend:5000;
         proxy_set_header Host $host;
         proxy_set_header X-Real-IP $remote_addr;
       }
     }
   }
   ```

4. Build and start the containers:
   ```
   cd docker
   docker-compose up -d
   ```

5. Access the application:
   - Production: https://yourdomain.com

## Default User

The application comes with a default user:
- Email: bogdan.bujor08@gmail.com
- Password: merlin97

## Backup and Restore

The SQLite database is stored in the `data` directory, which is mounted as a volume in the Docker container. To backup the database:

```
cp task-manager/data/taskmanager.db /path/to/backup/
```

To restore from a backup:

```
cp /path/to/backup/taskmanager.db task-manager/data/
```

## Troubleshooting

- If you encounter issues with the containers, check the logs:
  ```
  docker-compose logs -f
  ```

- To restart the services:
  ```
  docker-compose restart
  ```

- To completely rebuild the containers:
  ```
  docker-compose down
  docker-compose up -d --build