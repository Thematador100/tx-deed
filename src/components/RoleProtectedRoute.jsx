import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2 } from 'lucide-react';

const RoleProtectedRoute = ({ children, allowedRoles, isDemo = false }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (isDemo) {
    return children;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!profile || !allowedRoles.includes(profile.role)) {
    // Redirect to a more appropriate page, like the main dashboard or a membership upgrade page
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default RoleProtectedRoute;