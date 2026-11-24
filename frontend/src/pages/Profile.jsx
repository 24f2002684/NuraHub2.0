import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../api';
import { playClick, playSuccess, playError, playHover, playModalClose } from '../utils/sound';

export default function Profile({ onUserLoaded, onLogout }) {
  const navigate = useNavigate();

  const [account, setAccount] = useState({ username: '', email: '' });
  const [profile, setProfile] = useState({ full_name: '', age: '', bio: '', interests: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [statusAlert, setStatusAlert] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    apiRequest('/api/profile')
      .then((data) => {
        setAccount({ username: data.username, email: data.email });
        setProfile({
          full_name: data.full_name || '',
          age: data.age !== null && data.age !== undefined ? data.age : '',
          bio: data.bio || '',
          interests: (data.interests || []).join(', '),
        });
        if (onUserLoaded) onUserLoaded(data.username);
      })
      .catch((err) => {
        if (err.status === 401) {
          navigate('/login', { replace: true });
        } else {
          setStatusAlert({ type: 'danger', message: err.message || 'Failed to load profile' });
        }
      })
      .finally(() => setIsLoading(false));
  }, [navigate, onUserLoaded]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    playClick();
    setStatusAlert({ type: '', message: '' });
    setFieldErrors({});

    const parsedInterests = profile.interests
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    const payload = {
      full_name: profile.full_name,
      age: profile.age === '' ? null : Number(profile.age),
      bio: profile.bio,
      interests: parsedInterests,
    };

    setIsSaving(true);
    try {
      const updated = await apiRequest('/api/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      playSuccess();
      setProfile({
        full_name: updated.full_name || '',
        age: updated.age !== null && updated.age !== undefined ? updated.age : '',
        bio: updated.bio || '',
        interests: (updated.interests || []).join(', '),
      });
      setStatusAlert({ type: 'success', message: 'Profile updated successfully!' });
    } catch (err) {
      playError();
      if (err.errors) setFieldErrors(err.errors);
      setStatusAlert({ type: 'danger', message: err.message || 'Failed to update profile' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoutClick = async () => {
    playModalClose();
    try {
      await apiRequest('/api/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      if (onLogout) onLogout();
      navigate('/login');
    }
  };

  const initials = account.username
    ? account.username.slice(0, 2).toUpperCase()
    : 'U';

  const liveInterests = profile.interests
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (isLoading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" style={{ color: 'var(--rose-500)' }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-9 col-lg-7">
          <div className="glass-card p-4 p-md-5 mb-4" onMouseEnter={playHover}>
            {/* Header with Avatar & User Info */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="avatar-badge"
                  data-cursor="view"
                  data-cursor-text="VIEW"
                  title="User Avatar"
                  onMouseEnter={playHover}
                >
                  {initials}
                </div>
                <div>
                  <h2 className="fw-bold mb-0">{account.username}</h2>
                  <span className="text-muted small">{account.email}</span>
                </div>
              </div>
              <button
                className="btn btn-rose-outline btn-sm px-3"
                onClick={handleLogoutClick}
                data-cursor="pointer"
              >
                Logout
              </button>
            </div>

            {statusAlert.message && (
              <div
                className={`alert ${
                  statusAlert.type === 'success'
                    ? 'alert-custom-success'
                    : 'alert-custom-danger'
                } py-2 mb-4`}
                role="alert"
              >
                {statusAlert.message}
              </div>
            )}

            {/* Read-Only Account Overview Box */}
            <div className="info-box p-3 mb-4">
              <div className="row g-3">
                <div className="col-12 col-sm-6">
                  <div className="info-label">Username</div>
                  <div className="info-value">{account.username}</div>
                </div>
                <div className="col-12 col-sm-6">
                  <div className="info-label">Verified Email</div>
                  <div className="info-value">{account.email}</div>
                </div>
              </div>
            </div>

            {/* Editable Profile Form */}
            <form onSubmit={handleSave} noValidate>
              <div className="row g-3 mb-3">
                <div className="col-12 col-sm-8">
                  <label className="form-label" htmlFor="full_name">Full Name</label>
                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    maxLength={80}
                    className={`form-control glass-input ${fieldErrors.full_name ? 'is-invalid' : ''}`}
                    value={profile.full_name}
                    onChange={handleChange}
                    placeholder="e.g. Ada Lovelace"
                  />
                  {fieldErrors.full_name && <div className="invalid-feedback">{fieldErrors.full_name}</div>}
                </div>

                <div className="col-12 col-sm-4">
                  <label className="form-label" htmlFor="age">Age</label>
                  <input
                    id="age"
                    name="age"
                    type="number"
                    min={5}
                    max={120}
                    className={`form-control glass-input ${fieldErrors.age ? 'is-invalid' : ''}`}
                    value={profile.age}
                    onChange={handleChange}
                    placeholder="5 - 120"
                  />
                  {fieldErrors.age && <div className="invalid-feedback">{fieldErrors.age}</div>}
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  rows="3"
                  maxLength={500}
                  className={`form-control glass-input ${fieldErrors.bio ? 'is-invalid' : ''}`}
                  value={profile.bio}
                  onChange={handleChange}
                  placeholder="Share a short bio (up to 500 characters)"
                ></textarea>
                {fieldErrors.bio && <div className="invalid-feedback">{fieldErrors.bio}</div>}
              </div>

              <div className="mb-4">
                <label className="form-label" htmlFor="interests">Interests</label>
                <input
                  id="interests"
                  name="interests"
                  type="text"
                  className={`form-control glass-input ${fieldErrors.interests ? 'is-invalid' : ''}`}
                  value={profile.interests}
                  onChange={handleChange}
                  placeholder="e.g. Coding, Space, Music, Art"
                />
                <div className="helper-text mt-1">Separate multiple interests with commas.</div>
                {fieldErrors.interests && <div className="invalid-feedback">{fieldErrors.interests}</div>}

                {/* Live tag preview */}
                {liveInterests.length > 0 && (
                  <div className="mt-2 pt-2 border-top border-secondary border-opacity-10">
                    <span className="helper-text me-2 fw-semibold">Tags:</span>
                    {liveInterests.map((interest, idx) => (
                      <span
                        key={idx}
                        className="interest-chip"
                        data-cursor="pointer"
                        onMouseEnter={playHover}
                      >
                        #{interest}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-rose-primary px-4 py-2"
                disabled={isSaving}
                data-cursor="pointer"
              >
                {isSaving ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                ) : null}
                {isSaving ? 'Saving Changes...' : 'Save Profile'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
