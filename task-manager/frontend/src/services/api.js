import axios from 'axios';

// Use relative URL to leverage the proxy configuration in package.json
const baseURL = '/api';

console.log('API baseURL:', baseURL);

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// User API
export const userApi = {
  getCurrentUser: () => api.get('/user'),
  createUser: (username) => api.post('/user', { username }),
};

// Tasks API
export const tasksApi = {
  getTasks: () => api.get('/tasks'),
  getTaskHistory: (startDate, endDate) => 
    api.get(`/tasks/history?startDate=${startDate}&endDate=${endDate}`),
  createTask: (task) => api.post('/tasks', task),
  updateTask: (id, task) => api.put(`/tasks/${id}`, task),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
  getTaskStats: (period) => api.get(`/tasks/stats?period=${period}`),
};

// Pomodoro API
export const pomodoroApi = {
  startSession: (session) => api.post('/pomodoro/start', session),
  completeSession: (id) => api.put(`/pomodoro/${id}/complete`),
  getSessionHistory: (date) => api.get(`/pomodoro/history?date=${date}`),
};

// Error handling interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error.response?.data || error);
  }
);

export default api;