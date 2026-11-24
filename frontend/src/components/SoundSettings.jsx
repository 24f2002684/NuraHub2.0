import React, { useState, useEffect, useRef } from 'react';
import {
  isSoundEnabled,
  setSoundEnabled,
  getSoundVolume,
  setSoundVolume,
  playClick,
  playSuccess,
  playModalOpen,
  playModalClose,
} from '../utils/sound';

export default function SoundSettings() {
  const [enabled, setEnabled] = useState(isSoundEnabled);
  const [volume, setVolume] = useState(getSoundVolume);
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);

  // Sync state if changed elsewhere
  useEffect(() => {
    const handleSettingsChanged = (e) => {
      if (e.detail) {
        setEnabled(e.detail.enabled);
        setVolume(e.detail.volume);
      }
    };
    window.addEventListener('app:sound-settings-changed', handleSettingsChanged);
    return () => window.removeEventListener('app:sound-settings-changed', handleSettingsChanged);
  }, []);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        if (isOpen) {
          setIsOpen(false);
          playModalClose();
        }
      }
    };
    if (isOpen) {
      document.addEventListener('pointerdown', handleClickOutside);
    }
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [isOpen]);

  const togglePopover = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) {
      playModalOpen();
    } else {
      playModalClose();
    }
  };

  const handleToggleSound = (e) => {
    const newEnabled = e.target.checked;
    setEnabled(newEnabled);
    setSoundEnabled(newEnabled);
    if (newEnabled) {
      playClick();
    }
  };

  const handleVolumeChange = (e) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    setSoundVolume(newVol);
  };

  const handleTestSound = () => {
    playSuccess();
  };

  const volumePercent = Math.round(volume * 100);

  return (
    <div className="position-relative" ref={popoverRef}>
      {/* Sound Toggle Button in Navbar */}
      <button
        type="button"
        className="sound-control-btn"
        onClick={togglePopover}
        aria-label="Sound Settings"
        title={`Sound: ${enabled ? `ON (${volumePercent}%)` : 'OFF'}`}
        data-cursor="pointer"
      >
        <span className="sound-icon">{enabled ? (volume > 0.5 ? '🔊' : '🔉') : '🔇'}</span>
        <span className="d-none d-sm-inline">{enabled ? `${volumePercent}%` : 'Muted'}</span>
      </button>

      {/* Glassmorphic Sound Settings Popover */}
      {isOpen && (
        <div className="sound-popover shadow-lg" role="dialog" aria-label="Audio Controls">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="fw-bold small text-main d-flex align-items-center gap-2">
              <span>✦</span> Audio Effects
            </span>
            <button
              type="button"
              className="btn-close-popover"
              onClick={() => {
                setIsOpen(false);
                playModalClose();
              }}
              aria-label="Close sound settings"
              data-cursor="pointer"
            >
              ✕
            </button>
          </div>

          {/* Master Enable Switch */}
          <div className="form-check form-switch d-flex justify-content-between align-items-center ps-0 mb-3">
            <label className="form-check-label small fw-semibold text-main cursor-pointer" htmlFor="soundEnabledSwitch">
              UI Sound Effects
            </label>
            <input
              className="form-check-input ms-2 cursor-pointer sound-switch"
              type="checkbox"
              role="switch"
              id="soundEnabledSwitch"
              checked={enabled}
              onChange={handleToggleSound}
              data-cursor="pointer"
            />
          </div>

          {/* Volume Slider */}
          <div className={`mb-3 ${!enabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label htmlFor="soundVolumeRange" className="info-label mb-0">
                Volume
              </label>
              <span className="small fw-bold text-main">{volumePercent}%</span>
            </div>
            <input
              type="range"
              className="form-range sound-range"
              id="soundVolumeRange"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              disabled={!enabled}
              onChange={handleVolumeChange}
              onMouseUp={handleTestSound}
              onTouchEnd={handleTestSound}
              data-cursor="pointer"
            />
          </div>

          {/* Test Sound Button */}
          <button
            type="button"
            className="btn btn-rose-outline w-100 py-1 btn-sm"
            disabled={!enabled}
            onClick={handleTestSound}
            data-cursor="pointer"
          >
            ▶ Test Sound
          </button>
        </div>
      )}
    </div>
  );
}
