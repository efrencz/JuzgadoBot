import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { App } from './App.tsx';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AuthService from './services/authService';
import './index.css';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const verifyAuth = async () => {
      const isValid = await AuthService.verifyToken();
      setIsAuthenticated(isValid);
      setIsVerifying(false);
    };
    verifyAuth();
  }, []);

  if (isVerifying) {
    return <div>Verificando autenticación...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/admin" />;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/admin" element={<Login />} />
        <Route
          path="/admin/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  </StrictMode>
);
