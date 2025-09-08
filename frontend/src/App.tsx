import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SecurityProvider } from './contexts/SecurityContext';
import Layout from './components/Layout/Layout';
import Setup from './components/Auth/Setup';
import Login from './components/Auth/Login';
import Dashboard from './pages/Dashboard';
import Alerts from './pages/Alerts';
import FileMonitoring from './pages/FileMonitoring';
import NetworkMonitoring from './pages/NetworkMonitoring';
import Firewall from './pages/Firewall';
import Quarantine from './pages/Quarantine';
import Logs from './pages/Logs';
import UserManagement from './pages/UserManagement';
import Settings from './pages/Settings';

// Protected Route Component  
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isFirstTimeSetup, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (isFirstTimeSetup) {
    return <Navigate to="/setup" replace />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Auth Route Component (redirects if already authenticated)
const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isFirstTimeSetup, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (user && !isFirstTimeSetup) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

function AppContent() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/setup" element={
          <AuthRoute>
            <Setup />
          </AuthRoute>
        } />
        <Route path="/login" element={
          <AuthRoute>
            <Login />
          </AuthRoute>
        } />
        
        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <SecurityProvider>
              <Layout />
            </SecurityProvider>
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="monitoring/files" element={<FileMonitoring />} />
          <Route path="monitoring/network" element={<NetworkMonitoring />} />
          <Route path="prevention/firewall" element={<Firewall />} />
          <Route path="prevention/quarantined" element={<Quarantine />} />
          <Route path="logs" element={<Logs />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;