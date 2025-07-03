import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('adminToken');
  const userRole = localStorage.getItem('userRole');

  // Check if user is authenticated
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Check if user has required role
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/403" replace />;
  }

  return children;
};

export default ProtectedRoute;