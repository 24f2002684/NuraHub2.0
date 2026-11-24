import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppNavbar from './components/AppNavbar';
import Starfield from './components/Starfield';
import CustomCursor from './components/CustomCursor';
import Register from './pages/Register';
import Login from './pages/Login';
import Profile from './pages/Profile';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  
  // Theme state: defaults to dark mode, syncs with document data-theme attribute
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('app_theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="d-flex flex-column min-vh-100 position-relative">
      {/* Interactive premium custom mouse cursor */}
      <CustomCursor />

      {/* Flowing animated cosmos background */}
      <Starfield theme={theme} />

      <AppNavbar
        user={currentUser}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={() => setCurrentUser(null)}
      />

      <main className="flex-grow-1 position-relative" style={{ zIndex: 1 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/profile" replace />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login onLoginSuccess={setCurrentUser} />} />
          <Route
            path="/profile"
            element={
              <Profile
                onUserLoaded={setCurrentUser}
                onLogout={() => setCurrentUser(null)}
              />
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>
    </div>
  );
}
