/**
 * Premium Interactive Sound Effects System
 * Built on the Web Audio API for zero-latency, high-fidelity, dependency-free audio.
 * Includes volume control, mute toggle, localStorage persistence, and autoplay unlocking.
 */

let audioCtx = null;
let lastHoverTime = 0;

// Persistent Settings Defaults
const STORAGE_KEY_ENABLED = 'app_sound_enabled';
const STORAGE_KEY_VOLUME = 'app_sound_volume';

// Getters & Setters
export function isSoundEnabled() {
  const stored = localStorage.getItem(STORAGE_KEY_ENABLED);
  return stored !== 'false'; // Enabled by default
}

export function setSoundEnabled(enabled) {
  localStorage.setItem(STORAGE_KEY_ENABLED, enabled ? 'true' : 'false');
  window.dispatchEvent(new CustomEvent('app:sound-settings-changed', { detail: { enabled, volume: getSoundVolume() } }));
}

export function getSoundVolume() {
  const stored = localStorage.getItem(STORAGE_KEY_VOLUME);
  const parsed = parseFloat(stored);
  // Default subtle volume at 25% (0.25)
  return !isNaN(parsed) && parsed >= 0 && parsed <= 1 ? parsed : 0.25;
}

export function setSoundVolume(volume) {
  const clamped = Math.max(0, Math.min(1, volume));
  localStorage.setItem(STORAGE_KEY_VOLUME, clamped.toString());
  window.dispatchEvent(new CustomEvent('app:sound-settings-changed', { detail: { enabled: isSoundEnabled(), volume: clamped } }));
}

/**
 * Initialize / Unlock AudioContext on first user gesture
 */
function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }

  // Resume suspended context if browser autoplay policy paused it
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }

  return audioCtx;
}

// Global unlock on first user gesture
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    getAudioContext();
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };
  window.addEventListener('pointerdown', unlockAudio, { once: true, passive: true });
  window.addEventListener('keydown', unlockAudio, { once: true, passive: true });
}

/**
 * Create base master gain node for volume scaling
 */
function createMasterGain(ctx, customScale = 1) {
  const masterGain = ctx.createGain();
  const baseVolume = getSoundVolume();
  masterGain.gain.setValueAtTime(baseVolume * customScale, ctx.currentTime);
  masterGain.connect(ctx.destination);
  return masterGain;
}

/* ==========================================================================
   Sound Synthesis Profiles
   ========================================================================== */

/**
 * 1. Button Click: Soft, crisp mechanical/UI tap
 */
export function playClick() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const masterGain = createMasterGain(ctx, 0.4);

  // Filter to round out the click edges
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1600, now);

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(680, now);
  osc.frequency.exponentialRampToValueAtTime(140, now + 0.04);

  gain.gain.setValueAtTime(0.5, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

  osc.connect(gain);
  gain.connect(filter);
  filter.connect(masterGain);

  osc.start(now);
  osc.stop(now + 0.045);
}

/**
 * 2. Navigation Link Click: Subtle interface tick
 */
export function playNav() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const masterGain = createMasterGain(ctx, 0.35);

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1200, now);
  filter.Q.setValueAtTime(2, now);

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(950, now);
  osc.frequency.exponentialRampToValueAtTime(320, now + 0.035);

  gain.gain.setValueAtTime(0.4, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

  osc.connect(gain);
  gain.connect(filter);
  filter.connect(masterGain);

  osc.start(now);
  osc.stop(now + 0.04);
}

/**
 * 3. Interactive Card/Avatar Hover: Very light, subtle pop (throttled to avoid noise)
 */
export function playHover() {
  if (!isSoundEnabled()) return;
  const nowMs = Date.now();
  // Minimum 100ms throttle between hover pops
  if (nowMs - lastHoverTime < 100) return;
  lastHoverTime = nowMs;

  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const masterGain = createMasterGain(ctx, 0.15); // extremely gentle

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(420, now);
  osc.frequency.exponentialRampToValueAtTime(540, now + 0.03);

  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

  osc.connect(gain);
  gain.connect(masterGain);

  osc.start(now);
  osc.stop(now + 0.035);
}

/**
 * 4. Successful Form Submission: Pleasant, elegant confirmation chord
 */
export function playSuccess() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const masterGain = createMasterGain(ctx, 0.38);

  // Harmonic chord progression: A4 (440Hz), C#5 (554Hz), E5 (659Hz)
  const notes = [440, 554.37, 659.25, 880];
  const delayStep = 0.06;

  notes.forEach((freq, idx) => {
    const noteTime = now + idx * delayStep;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, noteTime);

    gain.gain.setValueAtTime(0, noteTime);
    gain.gain.linearRampToValueAtTime(0.25, noteTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.32);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(noteTime);
    osc.stop(noteTime + 0.34);
  });
}

/**
 * 5. Error Notifications: Subtle, warm error feedback
 */
export function playError() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const masterGain = createMasterGain(ctx, 0.4);

  // Soft dual low tones: 220Hz and 174Hz
  const freqs = [220, 174.61];

  freqs.forEach((freq) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.85, now + 0.22);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(now);
    osc.stop(now + 0.23);
  });
}

/**
 * 6. Theme Toggle / Mode Switch: Crisp switch sound
 */
export function playToggle() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const masterGain = createMasterGain(ctx, 0.32);

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(520, now);
  osc.frequency.exponentialRampToValueAtTime(780, now + 0.04);

  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

  osc.connect(gain);
  gain.connect(masterGain);

  osc.start(now);
  osc.stop(now + 0.045);
}

/**
 * 7. Modal / Popover Opening: Smooth, short whoosh
 */
export function playModalOpen() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const masterGain = createMasterGain(ctx, 0.25);

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(300, now);
  filter.frequency.exponentialRampToValueAtTime(800, now + 0.09);
  filter.Q.setValueAtTime(1.5, now);

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(260, now);
  osc.frequency.exponentialRampToValueAtTime(520, now + 0.09);

  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

  osc.connect(gain);
  gain.connect(filter);
  filter.connect(masterGain);

  osc.start(now);
  osc.stop(now + 0.1);
}

/**
 * 8. Modal Closing / Logout: Soft downward release
 */
export function playModalClose() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const masterGain = createMasterGain(ctx, 0.25);

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(450, now);
  osc.frequency.exponentialRampToValueAtTime(180, now + 0.06);

  gain.gain.setValueAtTime(0.28, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

  osc.connect(gain);
  gain.connect(masterGain);

  osc.start(now);
  osc.stop(now + 0.07);
}
