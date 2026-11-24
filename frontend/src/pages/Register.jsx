import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../api';
import { playClick, playNav, playSuccess, playError, playHover } from '../utils/sound';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateClientSide = () => {
    const errors = {};
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(formData.username)) {
      errors.username = 'Username must be 3-30 characters (letters, numbers, underscores).';
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address.';
    }
    const byteLen = new TextEncoder().encode(formData.password).length;
    if (byteLen < 8 || byteLen > 72) {
      errors.password = 'Password must be between 8 and 72 bytes.';
    } else if (!/[A-Za-z]/.test(formData.password) || !/\d/.test(formData.password)) {
      errors.password = 'Password must include at least one letter and one number.';
    }
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    playClick();
    setGeneralError('');
    const clientErrors = validateClientSide();
    if (Object.keys(clientErrors).length > 0) {
      playError();
      setFieldErrors(clientErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest('/api/register', {
        method: 'POST',
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });
      playSuccess();
      navigate('/login', { state: { message: 'Registered! Please log in.' } });
    } catch (err) {
      playError();
      if (err.errors && Object.keys(err.errors).length > 0) {
        setFieldErrors(err.errors);
      }
      setGeneralError(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-5">
          <div className="glass-card p-4 p-md-5" onMouseEnter={playHover}>
            <div className="text-center mb-4">
              <span className="brand-sparkle fs-2 d-block mb-1">✦</span>
              <h2 className="fw-bold mb-1">Create Account</h2>
              <p className="text-muted small">Join and experience secure session auth</p>
            </div>

            {generalError && (
              <div className="alert alert-custom-danger py-2 mb-3">
                {generalError}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-3">
                <label className="form-label" htmlFor="username">Username</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  className={`form-control glass-input ${fieldErrors.username ? 'is-invalid' : ''}`}
                  placeholder="e.g. alex_dev"
                  value={formData.username}
                  onChange={handleChange}
                  autoComplete="username"
                  required
                />
                {fieldErrors.username && <div className="invalid-feedback">{fieldErrors.username}</div>}
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className={`form-control glass-input ${fieldErrors.email ? 'is-invalid' : ''}`}
                  placeholder="alex@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
                {fieldErrors.email && <div className="invalid-feedback">{fieldErrors.email}</div>}
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="password">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className={`form-control glass-input ${fieldErrors.password ? 'is-invalid' : ''}`}
                  placeholder="At least 8 chars with letter & number"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />
                {fieldErrors.password && <div className="invalid-feedback">{fieldErrors.password}</div>}
              </div>

              <div className="mb-4">
                <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  className={`form-control glass-input ${fieldErrors.confirmPassword ? 'is-invalid' : ''}`}
                  placeholder="Repeat your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />
                {fieldErrors.confirmPassword && <div className="invalid-feedback">{fieldErrors.confirmPassword}</div>}
              </div>

              <button type="submit" className="btn btn-rose-primary w-100 py-2 mb-3" disabled={isSubmitting} data-cursor="pointer">
                {isSubmitting ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                ) : null}
                {isSubmitting ? 'Registering...' : 'Register Account'}
              </button>
            </form>

            <div className="text-center pt-3 border-top border-secondary border-opacity-25">
              <span className="text-muted small">Already registered? </span>
              <Link to="/login" onClick={playNav} className="text-decoration-none fw-semibold ms-1" style={{ color: 'var(--rose-400)' }} data-cursor="pointer">
                Sign in here &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
