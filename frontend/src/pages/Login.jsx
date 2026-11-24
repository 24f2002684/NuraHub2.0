import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { apiRequest } from '../api';
import { playClick, playNav, playSuccess, playError, playHover } from '../utils/sound';

export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState(location.state?.message || '');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    apiRequest('/api/profile')
      .then((data) => {
        if (onLoginSuccess) onLoginSuccess(data.username);
        navigate('/profile', { replace: true });
      })
      .catch(() => {
        // Not authenticated
      });
  }, [navigate, onLoginSuccess]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    playClick();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const data = await apiRequest('/api/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      });
      playSuccess();
      if (onLoginSuccess) onLoginSuccess(data.username);
      navigate('/profile');
    } catch (err) {
      playError();
      setErrorMsg(err.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-5">
          <div className="glass-card p-4 p-md-5" onMouseEnter={playHover}>
            <div className="text-center mb-4">
              <span className="brand-sparkle fs-2 d-block mb-1">✦</span>
              <h2 className="fw-bold mb-1">Welcome Back</h2>
              <p className="text-muted small">Sign in to your account</p>
            </div>

            {successMsg && (
              <div className="alert alert-custom-success py-2 mb-3">
                {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="alert alert-custom-danger py-2 mb-3">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-3">
                <label className="form-label" htmlFor="identifier">Username or Email</label>
                <input
                  id="identifier"
                  type="text"
                  className="form-control glass-input"
                  placeholder="Enter your username or email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label" htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  className="form-control glass-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              <button type="submit" className="btn btn-rose-primary w-100 py-2 mb-3" disabled={isLoading} data-cursor="pointer">
                {isLoading ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                ) : null}
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="text-center pt-3 border-top border-secondary border-opacity-25">
              <span className="text-muted small">Don't have an account? </span>
              <Link to="/register" onClick={playNav} className="text-decoration-none fw-semibold ms-1" style={{ color: 'var(--rose-400)' }} data-cursor="pointer">
                Register here &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
