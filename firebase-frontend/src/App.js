import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import UsersPage from './components/UsersPage';
import RoomsPage from './components/RoomsPage';
import ServicesPage from './components/ServicesPage';
import RoomDetailPage from './components/RoomDetailPage';
import ServiceDetailPage from './components/ServiceDetailPage';
import LoginPage from './components/LoginPage';
import BannersPage from './components/BannersPage';
import BillsPage from './components/BillsPage';
import DistrictsPage from './components/DistrictsPage';
import NotFoundPage from './components/NotFoundPage';
import UnauthorizedPage from './components/UnauthorizedPage';
import ServerErrorPage from './components/ServerErrorPage';
import ErrorBoundary from './components/ErrorBoundary';
import SessionTimeoutProvider from './components/SessionTimeoutProvider';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <SessionTimeoutProvider>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/404" element={<NotFoundPage />} />
            <Route path="/403" element={<UnauthorizedPage />} />
            <Route path="/500" element={<ServerErrorPage />} />
            
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Seller', 'Chủ trọ']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route 
                index 
                element={
                  <ProtectedRoute>
                    <IndexRedirect />
                  </ProtectedRoute>
                } 
              />
              
              <Route path="users" element={<ProtectedRoute allowedRoles={['Admin']}><UsersPage /></ProtectedRoute>} />
              <Route path="rooms" element={<ProtectedRoute allowedRoles={['Admin']}><RoomsPage /></ProtectedRoute>} />
              <Route path="rooms/:id" element={<ProtectedRoute allowedRoles={['Admin']}><RoomDetailPage /></ProtectedRoute>} />
              <Route path="banners" element={<ProtectedRoute allowedRoles={['Admin']}><BannersPage /></ProtectedRoute>} />
              <Route path="districts" element={<ProtectedRoute allowedRoles={['Admin']}><DistrictsPage /></ProtectedRoute>} />

              <Route path="services" element={<ProtectedRoute allowedRoles={['Seller']}><ServicesPage /></ProtectedRoute>} />
              <Route path="services/:id" element={<ProtectedRoute allowedRoles={['Seller']}><ServiceDetailPage /></ProtectedRoute>} />
              <Route path="bills" element={<ProtectedRoute allowedRoles={['Seller']}><BillsPage /></ProtectedRoute>} />
            </Route>
            
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </SessionTimeoutProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

function IndexRedirect() {
  const userRole = localStorage.getItem('userRole');
  return userRole === 'Seller' 
    ? <Navigate to="/dashboard/services" replace /> 
    : <Navigate to="/dashboard/users" replace />;
}

export default App;
