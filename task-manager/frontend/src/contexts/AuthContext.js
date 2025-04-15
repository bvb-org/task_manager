import React, { createContext, useState, useEffect, useContext } from 'react';
import { userApi } from '../services/api';

// Create the context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = userApi.getUser();

      if (token && storedUser) {
        setCurrentUser(storedUser);
        setIsAuthenticated(true);
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      console.log('Attempting login for:', email);
      const response = await userApi.login({ email, password });
      console.log('Login successful:', response);
      userApi.setAuthToken(response.token);
      userApi.setUser(response.user);
      setCurrentUser(response.user);
      setIsAuthenticated(true);
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      console.log('Attempting registration for:', userData.email);
      
      // Validate required fields
      if (!userData.username || !userData.email || !userData.password) {
        throw { error: 'All fields are required' };
      }
      
      console.log('Sending registration request with data:', {
        username: userData.username,
        email: userData.email,
        password: '***'
      });
      
      try {
        const response = await userApi.register(userData);
        
        console.log('Registration response received in AuthContext:', response);
        
        // Check if response has the expected format
        if (!response || !response.user || !response.token) {
          console.error('Invalid response format:', response);
          throw { error: 'Invalid response from server' };
        }
        
        // Store auth data
        userApi.setAuthToken(response.token);
        userApi.setUser(response.user);
        setCurrentUser(response.user);
        setIsAuthenticated(true);
        
        return response;
      } catch (apiError) {
        console.error('API error during registration:', apiError);
        
        // Handle specific API errors
        if (apiError.message && apiError.message.includes('HTML instead of JSON')) {
          console.error('Server returned HTML instead of JSON. This might be a server configuration issue.');
          throw { error: 'Server configuration error. Please contact support.' };
        }
        
        // Re-throw the error with more context if needed
        throw apiError;
      }
    } catch (error) {
      console.error('Registration failed in AuthContext:', error);
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    console.log('Logging out user');
    userApi.logout();
    setCurrentUser(null);
    setIsAuthenticated(false);
    console.log('User logged out successfully');
  };

  const value = {
    currentUser,
    isAuthenticated,
    loading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};