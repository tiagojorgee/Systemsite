import React, { useEffect, useRef, useState } from 'react';

interface InteractiveBackgroundProps {
  activeTab: string;
}

export const InteractiveBackground: React.FC<InteractiveBackgroundProps> = ({ activeTab }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [settings, setSettings] = useState({
    perfMode: 'ultra',
    reduceMotion: false,
    noEffects: false,
    highContrast: false,
  });

  const mouseRef = useRef({ x: -1000, y: -1000, targetX: -1000, targetY: -1000 });

  // Load and cache settings
  const refreshSettings = () => {
    const perfMode = localStorage.getItem('gamezone_perf_mode') || 'ultra';
    const reduceMotion = localStorage.getItem('gamezone_reduce_motion') === 'true';
    const noEffects = localStorage.getItem('gamezone_no_effects') === 'true';
    const highContrast = localStorage.getItem('gamezone_high_contrast') === 'true';
    setSettings({ perfMode, reduceMotion, noEffects, highContrast });
  };

  useEffect(() => {
    refreshSettings();
    window.addEventListener('gamezone_perf_settings_changed', refreshSettings);
    return () => {
      window.removeEventListener('gamezone_perf_settings_changed', refreshSettings);
    };
  }, []);

  // Track Mouse Movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current.targetX = e.clientX - rect.left;
      mouseRef.current.targetY = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouseRef.current.targetX = -1000;
      mouseRef.current.targetY = -1000;
    };

    // Track touch for mobile
    const handleTouchMove = (e: TouchEvent) => {
      if (!containerRef.current || e.touches.length === 0) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current.targetX = e.touches[0].clientX - rect.left;
      mouseRef.current.targetY = e.touches[0].clientY - rect.top;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  // Main Canvas Render Logic
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = container.clientWidth);
    let height = (canvas.height = container.clientHeight);

    // Watch Container Resize using ResizeObserver as instructed by Guidelines
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const entry = entries[0];
      width = canvas.width = entry.contentRect.width;
      height = canvas.height = entry.contentRect.height;
    });
    resizeObserver.observe(container);

    // Grab current Gamer theme accent color from HTML dataset or localstorage
    const getAccentColor = (): string => {
      const theme = localStorage.getItem('gamezone_gamer_theme') || 'cyber-green';
      switch (theme) {
        case 'cyber-green':
          return '#10b981'; // Emerald Green
        case 'neon-blue':
          return '#06b6d4'; // Cyan
        case 'purple-tech':
          return '#8b5cf6'; // Violet
        case 'red-inferno':
          return '#ef4444'; // Red
        case 'dark-carbon':
          return '#64748b'; // Slate
        case 'midnight-white':
          return '#ffffff'; // White
        default:
          return '#6366f1'; // Indigo
      }
    };

    // Particles array definition
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
      pulseSpeed?: number;
      phase?: number;
    }

    const particles: Particle[] = [];
    const maxParticles = settings.perfMode === 'ultra' ? 60 : settings.perfMode === 'balanced' ? 30 : 0;

    const initParticles = () => {
      particles.length = 0;
      if (settings.noEffects || settings.perfMode === 'economy' || settings.reduceMotion) return;

      const accent = getAccentColor();
      for (let i = 0; i < maxParticles; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.6,
          vy: (Math.random() - 0.5) * 0.6,
          size: Math.random() * 2 + 1,
          color: accent,
          alpha: Math.random() * 0.5 + 0.2,
          pulseSpeed: Math.random() * 0.02 + 0.005,
          phase: Math.random() * Math.PI * 2,
        });
      }
    };

    initParticles();

    // Circuit board traces state
    interface Trace {
      points: { x: number; y: number }[];
      progress: number;
      speed: number;
      width: number;
      color: string;
    }
    const circuitTraces: Trace[] = [];

    const spawnTrace = () => {
      if (circuitTraces.length > 5) return;
      const isVertical = Math.random() > 0.5;
      const startX = Math.random() * width;
      const startY = Math.random() * height;
      const length = Math.random() * 150 + 50;
      const points = [{ x: startX, y: startY }];

      if (isVertical) {
        points.push({ x: startX, y: startY + (Math.random() > 0.5 ? length : -length) });
        if (Math.random() > 0.5) {
          points.push({
            x: points[1].x + (Math.random() > 0.5 ? 50 : -50),
            y: points[1].y + (Math.random() > 0.5 ? 50 : -50),
          });
        }
      } else {
        points.push({ x: startX + (Math.random() > 0.5 ? length : -length), y: startY });
        if (Math.random() > 0.5) {
          points.push({
            x: points[1].x + (Math.random() > 0.5 ? 50 : -50),
            y: points[1].y + (Math.random() > 0.5 ? 50 : -50),
          });
        }
      }

      circuitTraces.push({
        points,
        progress: 0,
        speed: Math.random() * 0.02 + 0.01,
        width: Math.random() * 1.5 + 0.5,
        color: getAccentColor(),
      });
    };

    // Hexagons state
    interface GridHex {
      cx: number;
      cy: number;
      size: number;
      alpha: number;
      targetAlpha: number;
    }
    const hexes: GridHex[] = [];

    const initHexGrid = () => {
      hexes.length = 0;
      if (settings.noEffects || settings.perfMode === 'economy' || settings.reduceMotion) return;
      const size = 60;
      const h = size * Math.sqrt(3);
      const cols = Math.ceil(width / (size * 1.5)) + 1;
      const rows = Math.ceil(height / h) + 1;

      for (let col = 0; col < cols; col++) {
        for (let row = 0; row < rows; row++) {
          const cx = col * size * 1.5;
          const cy = row * h + (col % 2 === 0 ? 0 : h / 2);
          hexes.push({
            cx,
            cy,
            size,
            alpha: 0,
            targetAlpha: 0,
          });
        }
      }
    };

    if (activeTab === 'games' || activeTab === 'gamehub') {
      initHexGrid();
    }

    let waveOffset = 0;

    // Render loop
    const render = () => {
      if (!ctx || width === 0 || height === 0) return;

      // Clear with dark, slightly translucent slate backdrop if effects enabled, or solid in economy
      if (settings.noEffects || settings.perfMode === 'economy') {
        ctx.fillStyle = 'transparent';
        ctx.clearRect(0, 0, width, height);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Smooth mouse interpolation
      const mouse = mouseRef.current;
      if (mouse.x === -1000) {
        mouse.x = mouse.targetX;
        mouse.y = mouse.targetY;
      } else {
        mouse.x += (mouse.targetX - mouse.x) * 0.08;
        mouse.y += (mouse.targetY - mouse.y) * 0.08;
      }

      const accent = getAccentColor();

      // RENDER BASE ON ACTIVE TAB
      if (activeTab === 'home' || activeTab === 'profile' || activeTab === 'overview') {
        // STYLE 1: NEON PARTICLES & CONNECTED POINTS (Drifting digital stardust)
        ctx.lineWidth = 0.5;

        // Move and draw particles
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          if (!settings.reduceMotion) {
            p.x += p.vx;
            p.y += p.vy;

            // Boundary wrap
            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;

            // Interactive mouse attraction
            if (mouse.x !== -1000) {
              const dx = mouse.x - p.x;
              const dy = mouse.y - p.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < 180) {
                p.x += (dx / dist) * 0.35;
                p.y += (dy / dist) * 0.35;
              }
            }
          }

          // Pulsing sizing
          p.phase! += p.pulseSpeed!;
          const curAlpha = p.alpha * (0.6 + 0.4 * Math.sin(p.phase!));

          // Draw particle
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = accent;
          ctx.globalAlpha = curAlpha;
          ctx.fill();

          // Connect near particles (Connected Points)
          if (settings.perfMode === 'ultra') {
            for (let j = i + 1; j < particles.length; j++) {
              const p2 = particles[j];
              const dx = p.x - p2.x;
              const dy = p.y - p2.y;
              const dist = Math.sqrt(dx * dx + dy * dy);

              if (dist < 130) {
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.strokeStyle = accent;
                ctx.globalAlpha = (1 - dist / 130) * 0.12 * curAlpha;
                ctx.stroke();
              }
            }
          }
        }
      } else if (activeTab === 'games' || activeTab === 'gamehub' || activeTab === 'creatorhub') {
        // STYLE 2: HOLOGRAPHIC GRID & ANIMATED HEXAGONS
        ctx.strokeStyle = accent;
        ctx.lineWidth = 0.5;

        // Draw dynamic scrolling perspective grid
        const gridGap = 45;
        const scrollSpeed = settings.reduceMotion ? 0 : 0.15;
        waveOffset = (waveOffset + scrollSpeed) % gridGap;

        ctx.globalAlpha = 0.05;
        for (let x = waveOffset; x < width; x += gridGap) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = waveOffset; y < height; y += gridGap) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Animated interactive hexagons
        if (hexes.length > 0) {
          for (let i = 0; i < hexes.length; i++) {
            const h = hexes[i];
            
            // Check interaction distance with cursor
            if (mouse.x !== -1000) {
              const dx = mouse.x - h.cx;
              const dy = mouse.y - h.cy;
              const dist = Math.sqrt(dx * dx + dy * dy);
              h.targetAlpha = dist < 120 ? (1 - dist / 120) * 0.25 : 0.02;
            } else {
              h.targetAlpha = 0.02;
            }

            // Smooth alpha blending
            h.alpha += (h.targetAlpha - h.alpha) * 0.1;

            if (h.alpha > 0.01) {
              ctx.globalAlpha = h.alpha;
              ctx.beginPath();
              for (let k = 0; k < 6; k++) {
                const angle = (Math.PI / 3) * k;
                const x = h.cx + h.size * 0.5 * Math.cos(angle);
                const y = h.cy + h.size * 0.5 * Math.sin(angle);
                if (k === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
              }
              ctx.closePath();
              ctx.stroke();
            }
          }
        }
      } else if (activeTab === 'chat' || activeTab === 'feed' || activeTab === 'cinema') {
        // STYLE 3: DIGITAL NET & ENERGY FLOWS (Moving code paths)
        ctx.strokeStyle = accent;
        ctx.lineWidth = 0.75;

        if (Math.random() < 0.04 && circuitTraces.length < 8) {
          spawnTrace();
        }

        for (let i = circuitTraces.length - 1; i >= 0; i--) {
          const t = circuitTraces[i];
          if (!settings.reduceMotion) {
            t.progress += t.speed;
          } else {
            t.progress += 0.05;
          }

          if (t.progress >= 1) {
            circuitTraces.splice(i, 1);
            continue;
          }

          ctx.lineWidth = t.width;
          ctx.strokeStyle = t.color;
          ctx.globalAlpha = Math.sin(t.progress * Math.PI) * 0.25;

          ctx.beginPath();
          ctx.moveTo(t.points[0].x, t.points[0].y);

          // Interpolated path drawing
          const segmentCount = t.points.length - 1;
          const currentSegIndex = Math.min(
            segmentCount - 1,
            Math.floor(t.progress * segmentCount)
          );
          const segProgress = (t.progress * segmentCount) % 1;

          for (let s = 1; s <= currentSegIndex; s++) {
            ctx.lineTo(t.points[s].x, t.points[s].y);
          }

          const currentStart = t.points[currentSegIndex];
          const currentEnd = t.points[currentSegIndex + 1];
          const curX = currentStart.x + (currentEnd.x - currentStart.x) * segProgress;
          const curY = currentStart.y + (currentEnd.y - currentStart.y) * segProgress;
          ctx.lineTo(curX, curY);
          ctx.stroke();

          // Pulse tip glow
          ctx.beginPath();
          ctx.arc(curX, curY, t.width * 2, 0, Math.PI * 2);
          ctx.fillStyle = accent;
          ctx.globalAlpha = Math.sin(t.progress * Math.PI) * 0.5;
          ctx.fill();
        }
      } else if (activeTab === 'shop' || activeTab === 'gamezoneshop' || activeTab === 'finance') {
        // STYLE 4: FLUID SINE WAVES (Ondas de luz)
        if (!settings.reduceMotion) {
          waveOffset += 0.015;
        }

        ctx.lineWidth = 1.5;
        const waveCount = settings.perfMode === 'ultra' ? 3 : 1;

        for (let w = 0; w < waveCount; w++) {
          ctx.strokeStyle = accent;
          ctx.globalAlpha = (0.05 + (0.03 * (waveCount - w))) * (settings.perfMode === 'ultra' ? 1 : 0.6);
          ctx.beginPath();

          const amplitude = 30 + w * 12 + (mouse.y !== -1000 ? (mouse.y / height) * 20 : 0);
          const frequency = 0.003 - w * 0.0005 + (mouse.x !== -1000 ? (mouse.x / width) * 0.001 : 0);

          for (let x = 0; x < width; x += 10) {
            const y =
              height * 0.5 +
              Math.sin(x * frequency + waveOffset + w * 2) * amplitude +
              Math.cos(x * 0.001 - waveOffset) * 15;

            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      } else if (activeTab === 'security') {
        // STYLE 5: ELECTRONIC CIRCUITS / CIRCUITOS ELETRÔNICOS
        ctx.strokeStyle = accent;
        ctx.fillStyle = accent;

        // Subtle matrix of micro grid connection nodes
        ctx.globalAlpha = 0.04;
        const gridStep = 40;
        for (let x = 20; x < width; x += gridStep) {
          for (let y = 20; y < height; y += gridStep) {
            ctx.fillRect(x - 1, y - 1, 2, 2);
          }
        }

        // Draw micro vectors representing CPU / Circuit lines
        if (Math.random() < 0.03 && circuitTraces.length < 5) {
          spawnTrace();
        }

        for (let i = circuitTraces.length - 1; i >= 0; i--) {
          const t = circuitTraces[i];
          if (!settings.reduceMotion) {
            t.progress += t.speed * 0.8;
          } else {
            t.progress += 0.06;
          }

          if (t.progress >= 1) {
            circuitTraces.splice(i, 1);
            continue;
          }

          ctx.lineWidth = t.width * 1.5;
          ctx.strokeStyle = t.color;
          ctx.globalAlpha = Math.sin(t.progress * Math.PI) * 0.3;

          ctx.beginPath();
          ctx.moveTo(t.points[0].x, t.points[0].y);

          const currentStart = t.points[0];
          const currentEnd = t.points[1] || t.points[0];
          const curX = currentStart.x + (currentEnd.x - currentStart.x) * t.progress;
          const curY = currentStart.y + (currentEnd.y - currentStart.y) * t.progress;
          ctx.lineTo(curX, curY);
          ctx.stroke();
        }
      }

      ctx.globalAlpha = 1.0;
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
    };
  }, [activeTab, settings]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 w-full h-full pointer-events-none overflow-hidden transition-all duration-700 z-0 ${
        settings.highContrast ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        background: settings.noEffects ? 'transparent' : 'rgba(15, 23, 42, 0.01)',
      }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};
