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
import Firewall from './pages/Firewall';

// Protected Route Component  
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isFirstTimeSetup } = useAuth();
  
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
  const { user, isFirstTimeSetup } = useAuth();
  
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
          <Route path="monitoring/network" element={<div className="p-8 text-center text-gray-500">Network Monitoring, Coming Soon</div>} />
          <Route path="prevention/firewall" element={<Firewall />} />
          <Route path="prevention/quarantined" element={<div className="p-8 text-center text-gray-500">Quarantine Management - Coming Soon</div>} />
          <Route path="logs" element={<div className="p-8 text-center text-gray-500">System Logs - Coming Soon</div>} />
          <Route path="users" element={<div className="p-8 text-center text-gray-500">User Management - Coming Soon</div>} />
          <Route path="settings" element={<div className="p-8 text-center text-gray-500">Settings - Coming Soon</div>} />
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