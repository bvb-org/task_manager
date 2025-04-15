import axios from 'axios';

// Determine the correct API URL based on environment
const getBaseURL = () => {
  // In Docker environment, always use the explicit backend URL
  return 'http://localhost:5000/api';
};

// Use the getBaseURL function to get the baseURL
const baseURL = getBaseURL();
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

// Test connection to backend
export const testBackendConnection = async () => {
  try {
    const healthUrl = baseURL.replace('/api', '/health');
    console.log('Testing connection to backend at:', healthUrl);
    const response = await axios.get(healthUrl, {
      headers: {
        'Origin': window.location.origin
      }
    });
    console.log('Backend connection test response:', response.data);
    return { success: true, message: 'Connected to backend successfully' };
  } catch (error) {
    console.error('Backend connection test failed:', error);
    return {
      success: false,
      message: 'Failed to connect to backend',
      error: error.message
    };
  }
};

// User API
export const userApi = {
  getCurrentUser: () => {
    console.log('Fetching current user data');
    return api.get('/user');
  },
  createUser: (username) => {
    console.log('Creating user with username:', username);
    return api.post('/user', { username });
  },
  register: (userData) => {
    console.log('Registering new user with email:', userData.email);
    console.log('API baseURL being used:', baseURL);
    return api.post('/user/register', userData)
      .then(response => {
        console.log('Registration API response:', response);
        return response;
      })
      .catch(error => {
        console.error('Registration API error details:', error);
        throw error;
      });
  },
  login: (credentials) => {
    console.log('Logging in user with email:', credentials.email);
    return api.post('/user/login', credentials);
  },
  logout: () => {
    console.log('Logging out user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  isAuthenticated: () => {
    const isAuth = !!getToken();
    console.log('Authentication status:', isAuth);
    return isAuth;
  },
  setAuthToken: (token) => {
    if (token) {
      console.log('Setting auth token');
      localStorage.setItem('token', token);
    } else {
      console.log('Removing auth token');
      localStorage.removeItem('token');
    }
  },
  setUser: (user) => {
    if (user) {
      console.log('Saving user data to localStorage:', user.username);
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      console.log('Removing user data from localStorage');
      localStorage.removeItem('user');
    }
  },
  getUser: () => {
    const user = localStorage.getItem('user');
    const parsedUser = user ? JSON.parse(user) : null;
    console.log('Retrieved user from localStorage:', parsedUser ? parsedUser.username : 'none');
    return parsedUser;
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
  (response) => {
    console.log('API Response:', response.config.url, response.status);
    // Check if the response has data property
    if (response.data === undefined) {
      console.warn('API Response has no data property:', response);
      return response;
    }
    return response.data;
  },
  (error) => {
    // Log the error details
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', {
        url: error.config?.url,
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API Error Request (No response):', {
        url: error.config?.url,
        request: error.request
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Error Setup:', error.message);
    }
    
    // Handle specific error types
    if (error.code === 'ERR_NETWORK') {
      console.error('Network error - cannot connect to server');
      return Promise.reject({
        status: 0,
        error: 'Cannot connect to server. Please check if the backend is running.'
      });
    }
    
    if (error.code === 'ERR_BAD_RESPONSE') {
      console.error('Bad response from server');
      return Promise.reject({
        status: 0,
        error: 'Received invalid response from server. Please try again.'
      });
    }
    
    // Format error for consistent handling in components
    const formattedError = {
      status: error.response?.status || 500,
      error: error.response?.data?.error || error.message || 'An unexpected error occurred'
    };
    
    return Promise.reject(formattedError);
  }
);

export default api;