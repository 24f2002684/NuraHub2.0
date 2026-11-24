import React, { useEffect, useRef } from 'react';

/**
 * High-performance flowing starfield canvas with parallax depth, drifting stars,
 * and ambient cosmic nebulas that dynamically adjust to dark and light modes.
 */
export default function Starfield({ theme = 'dark' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Initialize stars with varied speeds and depths for a 3D parallax drift
    const STAR_COUNT = Math.min(140, Math.floor((width * height) / 9000));
    const stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.8 + 0.4,
      speed: Math.random() * 0.4 + 0.15,
      alpha: Math.random() * 0.7 + 0.3,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      hueOffset: Math.random(), // slight variation between rose, violet, and soft silver
    }));

    // Occasional shooting star
    let shootingStar = null;
    const spawnShootingStar = () => {
      shootingStar = {
        x: Math.random() * width * 0.7,
        y: Math.random() * height * 0.4,
        length: Math.random() * 70 + 40,
        speed: Math.random() * 6 + 6,
        alpha: 1,
        angle: Math.PI / 4 + (Math.random() - 0.5) * 0.2,
      };
    };

    let lastShootingStarTime = Date.now();

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const isDark = theme === 'dark';

      // Draw subtle ambient nebula glow in corners
      const gradient = ctx.createRadialGradient(
        width * 0.8,
        height * 0.15,
        10,
        width * 0.8,
        height * 0.15,
        Math.max(width, height) * 0.5
      );
      if (isDark) {
        gradient.addColorStop(0, 'rgba(244, 63, 94, 0.08)');
        gradient.addColorStop(0.5, 'rgba(190, 24, 93, 0.03)');
        gradient.addColorStop(1, 'transparent');
      } else {
        gradient.addColorStop(0, 'rgba(251, 113, 133, 0.12)');
        gradient.addColorStop(0.5, 'rgba(244, 63, 94, 0.04)');
        gradient.addColorStop(1, 'transparent');
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Secondary ambient glow in bottom-left
      const gradient2 = ctx.createRadialGradient(
        width * 0.15,
        height * 0.85,
        10,
        width * 0.15,
        height * 0.85,
        Math.max(width, height) * 0.45
      );
      if (isDark) {
        gradient2.addColorStop(0, 'rgba(136, 19, 55, 0.09)');
        gradient2.addColorStop(1, 'transparent');
      } else {
        gradient2.addColorStop(0, 'rgba(254, 205, 211, 0.35)');
        gradient2.addColorStop(1, 'transparent');
      }
      ctx.fillStyle = gradient2;
      ctx.fillRect(0, 0, width, height);

      // Render and update flowing stars
      for (const star of stars) {
        // Slowly drift upward and slightly to the right for a flowing cosmic stream
        star.y -= star.speed;
        star.x += star.speed * 0.25;

        // Wrap around viewport edges
        if (star.y < 0) {
          star.y = height;
          star.x = Math.random() * width;
        }
        if (star.x > width) {
          star.x = 0;
        }

        // Gentle twinkle animation
        star.alpha += Math.sin(Date.now() * star.twinkleSpeed) * 0.01;
        const currentAlpha = Math.max(0.15, Math.min(0.9, star.alpha));

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);

        if (isDark) {
          // Dark mode: predominantly rose, soft pink, and starry white
          if (star.hueOffset > 0.6) {
            ctx.fillStyle = `rgba(251, 113, 133, ${currentAlpha})`; // Rose pink
          } else if (star.hueOffset > 0.3) {
            ctx.fillStyle = `rgba(253, 164, 175, ${currentAlpha * 0.9})`; // Light rose
          } else {
            ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha * 0.85})`; // Star white
          }
        } else {
          // Light mode: delicate soft rose, blush, and warm coral specks
          if (star.hueOffset > 0.5) {
            ctx.fillStyle = `rgba(225, 29, 72, ${currentAlpha * 0.45})`; // Rose
          } else {
            ctx.fillStyle = `rgba(244, 63, 94, ${currentAlpha * 0.35})`; // Soft blush
          }
        }
        ctx.fill();
      }

      // Check shooting star trigger (roughly every 5 to 8 seconds)
      const now = Date.now();
      if (!shootingStar && now - lastShootingStarTime > 5500 && Math.random() < 0.03) {
        spawnShootingStar();
        lastShootingStarTime = now;
      }

      // Render shooting star if active
      if (shootingStar) {
        const tailX = shootingStar.x - Math.cos(shootingStar.angle) * shootingStar.length;
        const tailY = shootingStar.y - Math.sin(shootingStar.angle) * shootingStar.length;

        const starGrad = ctx.createLinearGradient(
          shootingStar.x,
          shootingStar.y,
          tailX,
          tailY
        );

        if (isDark) {
          starGrad.addColorStop(0, `rgba(255, 255, 255, ${shootingStar.alpha})`);
          starGrad.addColorStop(0.3, `rgba(251, 113, 133, ${shootingStar.alpha * 0.8})`);
          starGrad.addColorStop(1, 'transparent');
        } else {
          starGrad.addColorStop(0, `rgba(225, 29, 72, ${shootingStar.alpha * 0.7})`);
          starGrad.addColorStop(0.4, `rgba(251, 113, 133, ${shootingStar.alpha * 0.4})`);
          starGrad.addColorStop(1, 'transparent');
        }

        ctx.strokeStyle = starGrad;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(shootingStar.x, shootingStar.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();

        shootingStar.x += Math.cos(shootingStar.angle) * shootingStar.speed;
        shootingStar.y += Math.sin(shootingStar.angle) * shootingStar.speed;
        shootingStar.alpha -= 0.015;

        if (shootingStar.alpha <= 0) {
          shootingStar = null;
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed-top w-100 h-100"
      style={{
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
