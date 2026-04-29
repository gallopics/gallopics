import { useEffect, useRef } from 'react';
import './ComingSoonPage.css';

export function ComingSoonPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      a: number;
    }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.6 + 0.4,
        a: Math.random() * 0.3 + 0.05,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.a})`;
        ctx.fill();
      });
      animFrame = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="cs-root">
      <canvas ref={canvasRef} className="cs-canvas" aria-hidden="true" />
      <div className="cs-glow" aria-hidden="true" />

      <div className="cs-spacer" />

      <main className="cs-content">
        <div className="cs-logo-in cs-logo-wrap">
          <img
            src="/images/logo1-blue.svg"
            alt="Gallopics"
            className="cs-logo"
            draggable={false}
          />
        </div>

        <div className="cs-fade-1 cs-divider" aria-hidden="true" />

        <h1 className="cs-fade-2 cs-headline">
          Event galleries are almost ready.
        </h1>

        <p className="cs-fade-3 cs-sub">
          Built for the people behind the camera, the events in motion, and the
          riders looking for their favorite moments.
        </p>

        <div className="cs-fade-4 cs-audience-grid">
          <section className="cs-audience-card">
            <span>For photographers</span>
            <p>
              Book events, upload galleries, manage orders and track your sales
              all in one place.
            </p>
          </section>
          <section className="cs-audience-card">
            <span>For event teams</span>
            <p>
              Find the right photographers, coordinate coverage, and help riders
              discover their photos.
            </p>
          </section>
          <section className="cs-audience-card">
            <span>For riders</span>
            <p>
              Search your event, spot your photos, and purchase your favorites
              from horse competitions across Sweden.
            </p>
          </section>
        </div>

        <div className="cs-fade-4 cs-badge">
          <span className="cs-dot" aria-hidden="true" />
          Launching Soon
        </div>
      </main>

      <div className="cs-spacer" />

      <footer className="cs-fade-5 cs-footer">
        © {new Date().getFullYear()} Gallopics. All rights reserved.
      </footer>
    </div>
  );
}
