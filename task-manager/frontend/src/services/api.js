import axios from 'axios';

// Use relative URL to leverage the proxy configuration in package.json
const baseURL = '/api';

console.log('API baseURL:', baseURL);

// Get token from localStorage
const getToken = () => localStorage.getItem('token');

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(config => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// User API
export const userApi = {
  getCurrentUser: () => api.get('/user'),
  createUser: (username) => api.post('/user', { username }),
  register: (userData) => api.post('/user/register', userData),
  login: (credentials) => api.post('/user/login', credentials),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  isAuthenticated: () => {
    return !!getToken();
  },
  setAuthToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  },
  setUser: (user) => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  },
  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
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