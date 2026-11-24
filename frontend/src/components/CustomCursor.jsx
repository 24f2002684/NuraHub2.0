import React, { useEffect, useRef, useState } from 'react';

/**
 * Premium Interactive Custom Mouse Cursor
 * - Inner high-precision dot (6px)
 * - Trailing outer ring (32px) with smooth requestAnimationFrame lerp
 * - Hover scaling for interactive elements (buttons, links)
 * - data-cursor="view" -> expands with 'VIEW' label
 * - data-cursor="pointer" -> accent ring pulse
 * - Click feedback animation
 * - Graceful fallback / auto-disable on touch devices and prefers-reduced-motion
 */
export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const textRef = useRef(null);

  const [cursorState, setCursorState] = useState('default'); // 'default' | 'hover' | 'view' | 'pointer' | 'text'
  const [cursorText, setCursorText] = useState('');
  const [isClicking, setIsClicking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 1. Accessibility & Touch Detection: Only enable on devices with fine pointer (mouse/trackpad)
    const finePointerMedia = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reducedMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (!finePointerMedia.matches) {
      return; // Do not initialize on mobile/touch screens
    }

    const isReducedMotion = reducedMotionMedia.matches;

    // Mark HTML root to hide native cursor where custom cursor takes over
    document.documentElement.classList.add('has-custom-cursor');

    // Target coordinates (actual mouse position)
    let mouseX = -100;
    let mouseY = -100;

    // Trailing ring coordinates (interpolated position)
    let ringX = -100;
    let ringY = -100;

    // Lerp coefficient: higher = snappier, lower = smoother trail
    const LERP_FACTOR = isReducedMotion ? 1 : 0.18;

    let animFrameId;

    // Smooth animation loop using requestAnimationFrame
    const render = () => {
      // Lerp outer ring toward mouse target
      ringX += (mouseX - ringX) * LERP_FACTOR;
      ringY += (mouseY - ringY) * LERP_FACTOR;

      // Update inner dot directly at current mouse position
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
      }

      // Update outer ring at smoothed coordinates
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      }

      animFrameId = requestAnimationFrame(render);
    };

    animFrameId = requestAnimationFrame(render);

    // Track mouse movement
    const handleMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!isVisible) {
        setIsVisible(true);
      }
    };

    // Window leave / enter detection
    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    // Click feedback
    const handleMouseDown = () => {
      setIsClicking(true);
    };

    const handleMouseUp = () => {
      setIsClicking(false);
    };

    // Hover state detection via event delegation
    const handleMouseOver = (e) => {
      const target = e.target;
      if (!target || !(target instanceof Element)) return;

      // Check for explicit data-cursor attributes first
      const viewElement = target.closest('[data-cursor="view"]');
      if (viewElement) {
        setCursorState('view');
        setCursorText(viewElement.getAttribute('data-cursor-text') || 'VIEW');
        return;
      }

      const pointerElement = target.closest('[data-cursor="pointer"]');
      if (pointerElement) {
        setCursorState('pointer');
        setCursorText('');
        return;
      }

      // Text input detection: preserve standard text selection caret
      const isTextInput = target.closest(
        'input[type="text"], input[type="email"], input[type="password"], input[type="number"], textarea'
      );
      if (isTextInput) {
        setCursorState('text');
        setCursorText('');
        return;
      }

      // Standard interactive elements (buttons, links, controls)
      const interactive = target.closest(
        'button, a, .btn, [role="button"], input[type="submit"], input[type="button"], .theme-toggle-btn'
      );
      if (interactive) {
        setCursorState('hover');
        setCursorText('');
        return;
      }

      // Default state
      setCursorState('default');
      setCursorText('');
    };

    // Attach listeners
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseover', handleMouseOver, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    // Cleanup on unmount to prevent leaks
    return () => {
      document.documentElement.classList.remove('has-custom-cursor');
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, []);

  return (
    <div
      className={`custom-cursor-root state-${cursorState} ${isClicking ? 'is-clicking' : ''} ${
        isVisible ? 'is-visible' : 'is-hidden'
      }`}
      aria-hidden="true"
    >
      {/* High-precision inner dot */}
      <div ref={dotRef} className="cursor-dot" />

      {/* Trailing smooth outer ring */}
      <div ref={ringRef} className="cursor-ring">
        <span ref={textRef} className="cursor-text">
          {cursorText}
        </span>
      </div>
    </div>
  );
}
