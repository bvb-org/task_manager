import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { testBackendConnection } from '../../services/api';
import { Clock, Mail, Lock, User, UserPlus, CheckCircle } from 'lucide-react';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate form fields
    if (!username || !email || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);

    try {
      console.log('Registration form submitted for:', email);
      
      // Debug the request
      console.log('Sending registration data:', { username, email, password: '***' });
      
      // Create a direct API call to test connection
      const userData = { username, email, password };
      
      // Call the register function from AuthContext
      const response = await register(userData);
      
      // Debug the response
      console.log('Registration response received in component:', response);
      
      // Validate response
      if (!response) {
        console.error('Empty response received');
        throw new Error('No response received from server');
      }
      
      if (!response.user || !response.token) {
        console.error('Invalid response format:', response);
        throw new Error('Invalid response format from server');
      }
      
      // Show success message
      setSuccess(`Registration successful! Welcome, ${response.user.username}`);
      console.log('Setting success message and preparing to navigate');
      
      // Redirect to dashboard after a short delay to show the success message
      setTimeout(() => {
        console.log('Navigating to dashboard');
        navigate('/');
      }, 1500);
    } catch (err) {
      console.error('Registration form error details:', err);
      
      // Handle specific error cases
      if (err.error === 'Username or email already exists') {
        setError('This username or email is already registered. Please use a different one.');
      } else if (err.error === 'Server configuration error. Please contact support.') {
        setError('Server configuration error. Our team has been notified. Please try again later.');
        // You could add code here to notify your team about the issue
        console.error('CRITICAL: Server returning HTML instead of JSON for registration API');
      } else if (err.error && typeof err.error === 'string') {
        setError(err.error);
      } else if (err.message && err.message.includes('HTML instead of JSON')) {
        setError('Server configuration error. Our team has been notified. Please try again later.');
        console.error('CRITICAL: Server returning HTML instead of JSON for registration API');
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to register. Please try again.');
      }
      
      // Add connection test when registration fails
      checkConnection();
    } finally {
      setLoading(false);
    }
  };

  const checkConnection = async () => {
    setConnectionStatus('Checking connection...');
    try {
      const result = await testBackendConnection();
      if (result.success) {
        setConnectionStatus('✅ Connected to backend');
      } else {
        setConnectionStatus(`❌ Connection failed: ${result.message}`);
      }
    } catch (err) {
      setConnectionStatus(`❌ Error: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 animate-slide-up">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="relative w-20 h-20 bg-work-light rounded-full flex items-center justify-center shadow-md">
              <Clock className="h-10 w-10 text-work-primary" />
              <div className="absolute inset-0 rounded-full border-2 border-work-primary opacity-20 animate-pulse-slow"></div>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-neutral-800">
            Create Your Account
          </h2>
          <p className="mt-2 text-center text-sm text-neutral-600">
            Join us to boost your productivity and manage your time effectively
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm animate-fade-in" role="alert">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md shadow-sm animate-fade-in" role="alert">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="card p-6 bg-white shadow-lg rounded-xl">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-neutral-700 mb-1">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  className="input-field pl-10"
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-neutral-700 mb-1">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input-field pl-10"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="input-field pl-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <p className="mt-1 text-xs text-neutral-500">Password must be at least 8 characters</p>
            </div>
            
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-neutral-700 mb-1">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="input-field pl-10"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-work-primary hover:bg-work-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-work-accent transition-colors duration-200 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                ) : (
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <UserPlus className="h-5 w-5 text-work-light" />
                  </span>
                )}
                Create Account
              </button>
            </div>
          </form>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-neutral-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-work-primary hover:text-work-dark transition-colors">
              Sign in here
            </Link>
          </p>
          
          <div className="mt-4">
            <button
              type="button"
              onClick={checkConnection}
              className="text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              Test Backend Connection
            </button>
            {connectionStatus && (
              <div className="mt-2 text-xs text-neutral-600 bg-neutral-100 p-2 rounded inline-block">
                {connectionStatus}
              </div>
            )}
          </div>
          
          <div className="mt-6 flex justify-center space-x-4">
            <div className="text-xs text-neutral-500 hover:text-neutral-700 transition-colors">
              <a href="/privacy">Privacy Policy</a>
            </div>
            <div className="text-xs text-neutral-500 hover:text-neutral-700 transition-colors">
              <a href="/terms">Terms of Service</a>
            </div>
            <div className="text-xs text-neutral-500 hover:text-neutral-700 transition-colors">
              <a href="/contact">Contact</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;