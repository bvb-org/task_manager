import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Home, BarChart2, Clock, Calendar, Settings, Menu, X } from 'lucide-react';
import TaskManager from './components/TaskManager';
import TaskHistory from './components/TaskHistory';
import PomodoroHistory from './components/PomodoroHistory';
import Dashboard from './components/Dashboard';
import { userApi } from './services/api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Fetch the current user (or create default user if none exists)
    const fetchUser = async () => {
      try {
        setLoading(true);
        const userData = await userApi.getCurrentUser();
        setUser(userData);
      } catch (err) {
        console.error('Error fetching user:', err);
        // Try to create a default user
        try {
          const newUser = await userApi.createUser('default');
          setUser(newUser);
        } catch (createErr) {
          setError('Failed to initialize user. Please try again later.');
          console.error('Error creating user:', createErr);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Close mobile menu when a link is clicked
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Task Manager...</p>
        </div>
      </div>
    );
  }

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
      <div className="min-h-screen bg-gray-100 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-xl font-bold text-gray-800">Task Manager</h1>
                </div>
              </div>
              
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
              
              {/* Desktop navigation */}
              <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link to="/" className="inline-flex items-center px-1 pt-1 border-b-2 border-blue-500 text-sm font-medium text-gray-900">
                  <Home className="h-5 w-5 mr-1" />
                  Tasks
                </Link>
                <Link to="/history" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                  <Calendar className="h-5 w-5 mr-1" />
                  History
                </Link>
                <Link to="/pomodoro" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                  <Clock className="h-5 w-5 mr-1" />
                  Pomodoro
                </Link>
                <Link to="/dashboard" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                  <BarChart2 className="h-5 w-5 mr-1" />
                  Dashboard
                </Link>
              </nav>
            </div>
          </div>
          
          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="sm:hidden">
              <div className="pt-2 pb-3 space-y-1">
                <Link 
                  to="/" 
                  className="block pl-3 pr-4 py-2 border-l-4 border-blue-500 text-base font-medium text-blue-700 bg-blue-50"
                  onClick={closeMobileMenu}
                >
                  <div className="flex items-center">
                    <Home className="h-5 w-5 mr-2" />
                    Tasks
                  </div>
                </Link>
                <Link 
                  to="/history" 
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
                  onClick={closeMobileMenu}
                >
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    History
                  </div>
                </Link>
                <Link 
                  to="/pomodoro" 
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
                  onClick={closeMobileMenu}
                >
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Pomodoro
                  </div>
                </Link>
                <Link 
                  to="/dashboard" 
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
                  onClick={closeMobileMenu}
                >
                  <div className="flex items-center">
                    <BarChart2 className="h-5 w-5 mr-2" />
                    Dashboard
                  </div>
                </Link>
              </div>
            </div>
          )}
        </header>
        
        {/* Main content */}
        <main className="flex-1 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={<TaskManager />} />
              <Route path="/history" element={<TaskHistory />} />
              <Route path="/pomodoro" element={<PomodoroHistory />} />
              <Route path="/dashboard" element={<Dashboard />} />
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
    </Router>
  );
}

export default App;