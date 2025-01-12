import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { App } from './App.tsx';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AuthService from './services/authService';
import './index.css';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const isValid = await AuthService.verifyToken();
        setIsAuthenticated(isValid);
      } catch (error) {
        console.error('Error verifying token:', error);
        setIsAuthenticated(false);
      } finally {
        setIsVerifying(false);
      }
    };
    verifyAuth();
  }, []);

  if (isVerifying) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-xl">Verificando autenticación...</div>
    </div>;
  }

  return isAuthenticated ? (
    children
  ) : (
    <Navigate to="/admin" state={{ from: location }} replace />
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/admin" element={<Login />} />
        <Route path="/admin/dashboard" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  </StrictMode>
);
