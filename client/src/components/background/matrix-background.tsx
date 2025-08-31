import { useEffect, useRef } from "react";

const BG_IMAGE = "https://cdn.builder.io/api/v1/image/assets%2F29ccaf1d7d264cd2bd339333fe296f0c%2F913ebd41da4b41cbac8b5a86f2973640?format=webp&width=800";

type Particle = { x: number; y: number; vx: number; vy: number; r: number };
	export default function MatrixBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d", { alpha: true })!;

    const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    let width = 0;
    let height = 0;

    // Matrix rain setup (slower with per-column speed)
    const columns: { y: number; speed: number }[] = [];
    const glyphs = "const let function async await <> </> {} [] () class import export type extends interface".split(" ");

    // Subtle bouncing particles
    const particles: Particle[] = [];
    let obstacles: { x: number; y: number; w: number; h: number }[] = [];

    function captureObstacles() {
      const rects: DOMRect[] = Array.from(
        document.querySelectorAll(
          "header, .glass-morph, .bg-dark-panel, .rounded-xl, .card"
        )
      ).map((el) => el.getBoundingClientRect());
      obstacles = rects.map((r) => ({ x: r.left, y: r.top, w: r.width, h: r.height }));
    }

    function resize() {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * DPR);
      canvas.height = Math.floor(height * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      const colWidth = 24;
      const count = Math.ceil(width / colWidth);
      columns.length = 0;
      for (let i = 0; i < count; i++) {
        columns.push({ y: Math.random() * -200, speed: 20 + Math.random() * 25 }); // px/sec
      }

      // particles
      particles.length = 0;
      const N = Math.max(24, Math.floor((width * height) / 120000));
      for (let i = 0; i < N; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() * 0.3 + 0.05) * (Math.random() < 0.5 ? -1 : 1), // slow
          vy: (Math.random() * 0.3 + 0.05) * (Math.random() < 0.5 ? -1 : 1),
          r: 2,
        });
      }

      captureObstacles();
    }

    function drawHexNet() {
      const spacing = 70;
      const r = 1.5;
      ctx.save();
      ctx.globalAlpha = 0.2; // 80% transparent
      ctx.strokeStyle = "#ffd54f"; // soft yellow
      ctx.fillStyle = "#ffd54f";

      for (let y = -spacing; y < height + spacing; y += spacing * 0.86) {
        for (let x = -spacing; x < width + spacing; x += spacing) {
          const offsetX = (Math.round(y / (spacing * 0.86)) % 2 ? spacing / 2 : 0);
          const px = x + offsetX;
          const py = y;
          ctx.beginPath();
          ctx.arc(px, py, r, 0, Math.PI * 2);
          ctx.fill();
          // connect to right and down-right to suggest hex wiring
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + spacing / 2, py + spacing * 0.86);
          ctx.moveTo(px, py);
          ctx.lineTo(px + spacing, py);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    function drawMatrix(dt: number) {
      const colWidth = 24;
      ctx.save();
      ctx.globalAlpha = 0.2; // subtle
      ctx.font = "16px Fira Code, monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffeb3b"; // yellow

      columns.forEach((col, i) => {
        const x = i * colWidth + colWidth / 2;
        const char = glyphs[Math.floor(Math.random() * glyphs.length)] || "";
        ctx.fillText(char, x, col.y);
        col.y += col.speed * (dt / 1000);
        if (col.y > height + 20) col.y = Math.random() * -200;
      });
      ctx.restore();
    }

    function moveParticles(dt: number) {
      // collisions between particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          const minD = (a.r + b.r + 6) * (a.r + b.r + 6);
          if (d2 < minD) {
            // simple elastic swap
            const tvx = a.vx; const tvy = a.vy;
            a.vx = b.vx; a.vy = b.vy;
            b.vx = tvx; b.vy = tvy;
          }
        }
      }

      // bounce off obstacles
      if (obstacles.length) {
        particles.forEach((p) => {
          for (const o of obstacles) {
            if (p.x > o.x && p.x < o.x + o.w && p.y > o.y && p.y < o.y + o.h) {
              // reflect away from the center of obstacle
              const cx = o.x + o.w / 2;
              const cy = o.y + o.h / 2;
              p.vx = (p.x - cx > 0 ? 1 : -1) * Math.abs(p.vx);
              p.vy = (p.y - cy > 0 ? 1 : -1) * Math.abs(p.vy);
            }
          }
        });
      }
    }

    function drawParticles() {
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = "#ffd54f";
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    let prev = performance.now();
    function loop(now: number) {
      const dt = Math.min(50, now - prev); // clamp dt for stability
      prev = now;
      ctx.clearRect(0, 0, width, height);
      drawHexNet();
      drawMatrix(dt);
      moveParticles(dt);
      drawParticles();
      rafRef.current = requestAnimationFrame(loop);
    }

    resize();
    captureObstacles();
    const resizeObs = new ResizeObserver(() => captureObstacles());
    resizeObs.observe(document.body);

    rafRef.current = requestAnimationFrame(loop);
    window.addEventListener("resize", resize);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      resizeObs.disconnect();
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10"
      style={{
        backgroundImage: `url(${BG_IMAGE})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        filter: "saturate(0.7) brightness(0.6)",
        opacity: 0.2, // 80% transparent
      }}
    >
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
