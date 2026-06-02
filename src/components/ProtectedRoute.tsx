import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  isConfidential?: boolean;
}

export default function ProtectedRoute({ children, isConfidential = false }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login but save the attempted url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If it's a confidential route, check if user has access
  // For demo purposes, we assume 'Admin', 'Administrator', 'Developer', and 'Viewer' roles have access.
  const adminRoles = ['Admin', 'Administrator', 'Developer', 'Viewer'];
  if (isConfidential && !adminRoles.includes(user?.role || '')) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-gray-500">
        <Lock className="mb-4 h-16 w-16 text-red-500" />
        <h1 className="text-2xl font-bold text-gray-800">Access Denied</h1>
        <p className="mt-2 text-sm max-w-md text-center">
          This is a confidential module. You do not have permission to view this content. 
          Please contact your Administrator (MEAT PRO) to request access.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
