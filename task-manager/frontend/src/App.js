import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { Home, BarChart2, Clock, Calendar, Settings, Menu, X, LogOut } from 'lucide-react';
import TaskManager from './components/TaskManager';
import TaskHistory from './components/TaskHistory';
import PomodoroHistory from './components/PomodoroHistory';
import Dashboard from './components/Dashboard';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { userApi } from './services/api';
import { TimerProvider } from './contexts/TimerContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Navigation component that uses useLocation hook
function Navigation({ mobileMenuOpen, closeMobileMenu, currentUser, logout }) {
  const location = useLocation();
  const pathname = location.pathname;
  
  return (
    <>
      {/* Desktop navigation */}
      <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
        <Link
          to="/"
          className={`inline-flex items-center px-1 pt-1 border-b-2 ${pathname === '/' ? 'border-blue-500 text-sm font-medium text-gray-900' : 'border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          <Home className="h-5 w-5 mr-1" />
          Tasks
        </Link>
        <Link
          to="/history"
          className={`inline-flex items-center px-1 pt-1 border-b-2 ${pathname === '/history' ? 'border-blue-500 text-sm font-medium text-gray-900' : 'border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          <Calendar className="h-5 w-5 mr-1" />
          History
        </Link>
        <Link
          to="/pomodoro"
          className={`inline-flex items-center px-1 pt-1 border-b-2 ${pathname === '/pomodoro' ? 'border-blue-500 text-sm font-medium text-gray-900' : 'border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          <Clock className="h-5 w-5 mr-1" />
          Pomodoro
        </Link>
        <Link
          to="/dashboard"
          className={`inline-flex items-center px-1 pt-1 border-b-2 ${pathname === '/dashboard' ? 'border-blue-500 text-sm font-medium text-gray-900' : 'border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
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
              className={`block pl-3 pr-4 py-2 border-l-4 ${pathname === '/' ? 'border-blue-500 text-base font-medium text-blue-700 bg-blue-50' : 'border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'}`}
              onClick={closeMobileMenu}
            >
              <div className="flex items-center">
                <Home className="h-5 w-5 mr-2" />
                Tasks
              </div>
            </Link>
            <Link
              to="/history"
              className={`block pl-3 pr-4 py-2 border-l-4 ${pathname === '/history' ? 'border-blue-500 text-base font-medium text-blue-700 bg-blue-50' : 'border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'}`}
              onClick={closeMobileMenu}
            >
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                History
              </div>
            </Link>
            <Link
              to="/pomodoro"
              className={`block pl-3 pr-4 py-2 border-l-4 ${pathname === '/pomodoro' ? 'border-blue-500 text-base font-medium text-blue-700 bg-blue-50' : 'border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'}`}
              onClick={closeMobileMenu}
            >
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Pomodoro
              </div>
            </Link>
            <Link
              to="/dashboard"
              className={`block pl-3 pr-4 py-2 border-l-4 ${pathname === '/dashboard' ? 'border-blue-500 text-base font-medium text-blue-700 bg-blue-50' : 'border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'}`}
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
                className="w-full text-left block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Close mobile menu when a link is clicked
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-800">Task Manager</h1>
              </div>
              <div className="ml-6 flex items-center">
                {currentUser && (
                  <span className="text-sm text-gray-600">
                    Welcome, {currentUser.username}
                  </span>
                )}
              </div>
            </div>
            
            {/* Logout button */}
            {currentUser && (
              <div className="hidden sm:ml-6 sm:flex sm:items-center">
                <button
                  onClick={logout}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
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
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            Task Manager © {new Date().getFullYear()} - Stay productive and focused!
          </p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  const [error, setError] = useState(null);

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