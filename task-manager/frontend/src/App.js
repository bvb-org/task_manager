import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { Home, BarChart2, Clock, Calendar, Menu, X, LogOut } from 'lucide-react';
import TaskManager from './components/TaskManager';
import TaskHistory from './components/TaskHistory';
import PomodoroHistory from './components/PomodoroHistory';
import Dashboard from './components/Dashboard';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { TimerProvider, useTimer } from './contexts/TimerContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Navigation component that uses useLocation hook
function Navigation({ mobileMenuOpen, closeMobileMenu, currentUser, logout }) {
  const location = useLocation();
  const pathname = location.pathname;
  const { isBreak } = useTimer();
  
  return (
    <>
      {/* Desktop navigation */}
      <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
        <Link
          to="/"
          className={`inline-flex items-center px-1 pt-1 border-b-2 transition-colors duration-300 ${
            pathname === '/' 
              ? (isBreak ? 'border-break-primary text-break-dark' : 'border-work-primary text-work-dark') 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Home className="h-5 w-5 mr-1" />
          Tasks
        </Link>
        <Link
          to="/history"
          className={`inline-flex items-center px-1 pt-1 border-b-2 transition-colors duration-300 ${
            pathname === '/history' 
              ? (isBreak ? 'border-break-primary text-break-dark' : 'border-work-primary text-work-dark') 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Calendar className="h-5 w-5 mr-1" />
          History
        </Link>
        <Link
          to="/pomodoro"
          className={`inline-flex items-center px-1 pt-1 border-b-2 transition-colors duration-300 ${
            pathname === '/pomodoro' 
              ? (isBreak ? 'border-break-primary text-break-dark' : 'border-work-primary text-work-dark') 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Clock className="h-5 w-5 mr-1" />
          Pomodoro
        </Link>
        <Link
          to="/dashboard"
          className={`inline-flex items-center px-1 pt-1 border-b-2 transition-colors duration-300 ${
            pathname === '/dashboard' 
              ? (isBreak ? 'border-break-primary text-break-dark' : 'border-work-primary text-work-dark') 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <BarChart2 className="h-5 w-5 mr-1" />
          Dashboard
        </Link>
      </nav>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              to="/"
              className={`block pl-3 pr-4 py-2 border-l-4 transition-colors duration-300 ${
                pathname === '/' 
                  ? (isBreak ? 'border-break-primary text-break-dark bg-break-light' : 'border-work-primary text-work-dark bg-work-light') 
                  : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
              }`}
              onClick={closeMobileMenu}
            >
              <div className="flex items-center">
                <Home className="h-5 w-5 mr-2" />
                Tasks
              </div>
            </Link>
            <Link
              to="/history"
              className={`block pl-3 pr-4 py-2 border-l-4 transition-colors duration-300 ${
                pathname === '/history' 
                  ? (isBreak ? 'border-break-primary text-break-dark bg-break-light' : 'border-work-primary text-work-dark bg-work-light') 
                  : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
              }`}
              onClick={closeMobileMenu}
            >
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                History
              </div>
            </Link>
            <Link
              to="/pomodoro"
              className={`block pl-3 pr-4 py-2 border-l-4 transition-colors duration-300 ${
                pathname === '/pomodoro' 
                  ? (isBreak ? 'border-break-primary text-break-dark bg-break-light' : 'border-work-primary text-work-dark bg-work-light') 
                  : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
              }`}
              onClick={closeMobileMenu}
            >
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Pomodoro
              </div>
            </Link>
            <Link
              to="/dashboard"
              className={`block pl-3 pr-4 py-2 border-l-4 transition-colors duration-300 ${
                pathname === '/dashboard' 
                  ? (isBreak ? 'border-break-primary text-break-dark bg-break-light' : 'border-work-primary text-work-dark bg-work-light') 
                  : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
              }`}
              onClick={closeMobileMenu}
            >
              <div className="flex items-center">
                <BarChart2 className="h-5 w-5 mr-2" />
                Dashboard
              </div>
            </Link>
            {currentUser && (
              <button
                onClick={() => {
                  logout();
                  closeMobileMenu();
                }}
                className="w-full text-left block pl-3 pr-4 py-2 border-l-4 border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 transition-colors duration-300"
              >
                <div className="flex items-center">
                  <LogOut className="h-5 w-5 mr-2" />
                  Logout
                </div>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// Main App Layout component
function AppLayout() {
  const { currentUser, logout } = useAuth();
  const { isBreak, isRunning } = useTimer();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Close mobile menu when a link is clicked
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Update body class based on timer state
  useEffect(() => {
    const body = document.body;
    if (isBreak) {
      body.classList.add('break-mode');
      body.classList.remove('work-mode');
    } else {
      body.classList.add('work-mode');
      body.classList.remove('break-mode');
    }

    return () => {
      body.classList.remove('break-mode', 'work-mode');
    };
  }, [isBreak]);

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${
      isBreak ? 'bg-break-background' : 'bg-work-background'
    }`}>
      {/* Header */}
      <header className={`shadow-sm transition-colors duration-500 ${
        isBreak ? 'bg-white' : 'bg-white'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <div className={`flex items-center transition-colors duration-500 ${
                  isBreak ? 'text-break-primary' : 'text-work-primary'
                }`}>
                  <Clock className="h-6 w-6 mr-2" />
                  <h1 className={`text-xl font-bold ${
                    isBreak ? 'text-break-dark' : 'text-work-dark'
                  }`}>
                    Task Manager
                  </h1>
                </div>
              </div>
              <div className="ml-6 flex items-center">
                {currentUser && (
                  <span className="text-sm text-gray-600">
                    Welcome, {currentUser.username}
                  </span>
                )}
              </div>
            </div>
            
            {/* Timer status indicator */}
            {isRunning && (
              <div className="hidden sm:flex items-center">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isBreak 
                    ? 'bg-break-light text-break-dark' 
                    : 'bg-work-light text-work-dark'
                }`}>
                  {isBreak ? '☕ Break Time' : '🎯 Focus Mode'}
                </div>
              </div>
            )}
            
            {/* Logout button */}
            {currentUser && (
              <div className="hidden sm:ml-6 sm:flex sm:items-center">
                <button
                  onClick={logout}
                  className={`inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md transition-colors duration-300 ${
                    isBreak 
                      ? 'text-break-dark bg-break-light hover:bg-break-primary hover:text-white' 
                      : 'text-work-dark bg-work-light hover:bg-work-primary hover:text-white'
                  }`}
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </button>
              </div>
            )}
            
            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
              <button
                onClick={toggleMobileMenu}
                className={`inline-flex items-center justify-center p-2 rounded-md transition-colors duration-300 ${
                  isBreak 
                    ? 'text-break-dark hover:text-break-primary hover:bg-break-light' 
                    : 'text-work-dark hover:text-work-primary hover:bg-work-light'
                }`}
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
            </div>
            
            {/* Use the Navigation component */}
            <Navigation
              mobileMenuOpen={mobileMenuOpen}
              closeMobileMenu={closeMobileMenu}
              currentUser={currentUser}
              logout={logout}
            />
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<TaskManager />} />
              <Route path="/history" element={<TaskHistory />} />
              <Route path="/pomodoro" element={<PomodoroHistory />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Route>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
      
      {/* Footer */}
      <footer className={`border-t transition-colors duration-500 py-4 ${
        isBreak ? 'bg-white border-break-light' : 'bg-white border-work-light'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className={`text-center text-sm ${
              isBreak ? 'text-break-dark' : 'text-work-dark'
            }`}>
              Task Manager © {new Date().getFullYear()} - Stay productive and focused!
            </p>
            <div className="mt-2 sm:mt-0 flex space-x-4">
              <a href="/privacy" className={`text-xs ${
                isBreak ? 'text-break-primary hover:text-break-dark' : 'text-work-primary hover:text-work-dark'
              } transition-colors duration-300`}>
                Privacy Policy
              </a>
              <a href="/terms" className={`text-xs ${
                isBreak ? 'text-break-primary hover:text-break-dark' : 'text-work-primary hover:text-work-dark'
              } transition-colors duration-300`}>
                Terms of Service
              </a>
              <a href="/contact" className={`text-xs ${
                isBreak ? 'text-break-primary hover:text-break-dark' : 'text-work-primary hover:text-work-dark'
              } transition-colors duration-300`}>
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  const [error, setError] = useState(null);
  
  // Error handler function that can be used throughout the app
  const handleError = (errorMessage) => {
    setError(errorMessage);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-red-500 text-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-center mb-2">Error</h2>
          <p className="text-gray-600 text-center">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <AuthProvider>
        <TimerProvider>
          <AppLayout />
        </TimerProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;