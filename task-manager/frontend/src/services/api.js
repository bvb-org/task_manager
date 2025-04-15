import axios from 'axios';

// Determine the correct API URL based on environment
const getBaseURL = () => {
  // Check if we're running on the Cloudflare tunnel domain
  if (window.location.hostname === 'pomodoro.gris.ninja') {
    // When running on Cloudflare tunnel, use the backend subdomain
    return 'https://pomodoro-backend.gris.ninja/api';
  } else if (window.location.hostname === 'localhost') {
    // Local development
    return 'http://localhost:5000/api';
  } else {
    // Docker development environment or other environments
    // Use the container name when inside Docker network
    return 'http://task-manager-backend:5000/api';
  }
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
    // Construct the health URL based on the current environment
    let healthUrl;
    if (window.location.hostname === 'pomodoro.gris.ninja') {
      healthUrl = 'https://pomodoro-backend.gris.ninja/health';
    } else if (window.location.hostname === 'localhost') {
      healthUrl = 'http://localhost:5000/health';
    } else {
      healthUrl = 'http://task-manager-backend:5000/health';
    }
    
    console.log('Testing connection to backend at:', healthUrl);
    const response = await axios.get(healthUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': window.location.origin
      }
    });
    console.log('Backend connection test response:', response.data);
    return { success: true, message: 'Connected to backend successfully', data: response.data };
  } catch (error) {
    console.error('Backend connection test failed:', error);
    return {
      success: false,
      message: 'Failed to connect to backend',
      error: error.message,
      url: error.config?.url
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
        
        // Validate response format
        if (typeof response === 'string' || response instanceof String) {
          console.error('Received string response instead of JSON:', response);
          throw new Error('Invalid response format: received HTML instead of JSON');
        }
        
        // Ensure we have the expected data structure
        if (!response || !response.user || !response.token) {
          console.error('Invalid response structure:', response);
          throw new Error('Invalid response format from server');
        }
        
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
    
    // Check if the response is HTML instead of JSON
    if (typeof response.data === 'string' &&
        (response.data.includes('<!doctype html>') ||
         response.data.includes('<!DOCTYPE html>') ||
         response.data.includes('<html'))) {
      console.error('Received HTML response instead of JSON:', response.config.url);
      console.error('HTML content preview:', response.data.substring(0, 200) + '...');
      
      // Try to extract any error message from the HTML
      let errorMessage = 'Invalid response format: received HTML instead of JSON';
      try {
        const titleMatch = response.data.match(/<title>(.*?)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
          errorMessage += ` - Page title: ${titleMatch[1]}`;
        }
      } catch (e) {
        // Ignore extraction errors
      }
      
      throw new Error(errorMessage);
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
    
    // Handle specific error types with more detailed information
    if (error.code === 'ERR_NETWORK') {
      console.error('Network error - cannot connect to server', {
        url: error.config?.url,
        baseURL: baseURL,
        hostname: window.location.hostname
      });
      return Promise.reject({
        status: 0,
        error: `Cannot connect to server at ${error.config?.url}. Please check if the backend is running and accessible.`,
        code: error.code
      });
    }
    
    if (error.code === 'ERR_BAD_RESPONSE') {
      console.error('Bad response from server', {
        url: error.config?.url,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      return Promise.reject({
        status: error.response?.status || 0,
        error: `Received invalid response from server (${error.response?.status || 'unknown status'}). Please try again.`,
        code: error.code
      });
    }
    
    // Handle CORS errors
    if (error.message && error.message.includes('Network Error')) {
      console.error('Possible CORS error', {
        url: error.config?.url,
        origin: window.location.origin
      });
      return Promise.reject({
        status: 0,
        error: `CORS error when connecting to ${error.config?.url}. The server may not allow requests from ${window.location.origin}.`,
        code: 'CORS_ERROR'
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