import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../api';
import SoundSettings from './SoundSettings';
import { playClick, playNav, playToggle } from '../utils/sound';

export default function AppNavbar({ user, theme, onToggleTheme, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    playClick();
    try {
      await apiRequest('/api/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      if (onLogout) onLogout();
      navigate('/login');
    }
  };

  const handleThemeToggleClick = () => {
    playToggle();
    onToggleTheme();
  };

  return (
    <nav className="navbar navbar-expand-lg glass-navbar sticky-top">
      <div className="container">
        <Link
          className="navbar-brand fw-bold d-flex align-items-center gap-2"
          to="/profile"
          onClick={playNav}
          data-cursor="pointer"
        >
          <span className="brand-sparkle fs-4">✦</span>
          <span style={{ letterSpacing: '0.5px' }}>AuthApp</span>
        </Link>

        {/* Mobile menu toggler */}
        <button
          className="navbar-toggler border-0 p-1"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#appNavContent"
          aria-controls="appNavContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
          onClick={playClick}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="appNavContent">
          <ul className="navbar-nav ms-auto align-items-lg-center gap-2 my-2 my-lg-0">
            {/* Audio Effects Control */}
            <li className="nav-item">
              <SoundSettings />
            </li>

            {/* Theme Toggle Button */}
            <li className="nav-item">
              <button
                type="button"
                className="theme-toggle-btn"
                onClick={handleThemeToggleClick}
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
                data-cursor="pointer"
              >
                {theme === 'dark' ? (
                  <>
                    <span role="img" aria-label="Dark mode">🌙</span>
                    <span>Dark Rose</span>
                  </>
                ) : (
                  <>
                    <span role="img" aria-label="Light mode">☀️</span>
                    <span>Light Rose</span>
                  </>
                )}
              </button>
            </li>

            {user ? (
              <>
                <li className="nav-item">
                  <span className="nav-link px-2">
                    Signed in as <strong style={{ color: 'var(--rose-400)' }}>{user}</strong>
                  </span>
                </li>
                <li className="nav-item">
                  <button className="btn btn-rose-outline btn-sm px-3" onClick={handleLogout} data-cursor="pointer">
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link px-2" to="/login" onClick={playNav} data-cursor="pointer">
                    Login
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="btn btn-rose-primary btn-sm px-3" to="/register" onClick={playClick} data-cursor="pointer">
                    Create Account
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
