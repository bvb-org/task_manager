import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = () => {
  const { isAuthenticated, loading, currentUser } = useAuth();

  console.log('ProtectedRoute - Authentication Status:', { isAuthenticated, loading, user: currentUser?.username });

  // If still loading, show nothing or a loading spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    console.log('User not authenticated, redirecting to login page');
    return <Navigate to="/login" replace />;
  }

  console.log('User authenticated, rendering protected content');

  // If authenticated, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;