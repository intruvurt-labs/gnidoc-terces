import { useEffect, useRef } from "react";

const BG_IMAGE = "https://cdn.builder.io/api/v1/image/assets%2F29ccaf1d7d264cd2bd339333fe296f0c%2F913ebd41da4b41cbac8b5a86f2973640?format=webp&width=800";

export default function MatrixBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d", { alpha: true })!;

    const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    let width = 0;
    let height = 0;

    // Matrix rain setup
    const columns: { y: number }[] = [];
    const glyphs = "const let function async await <> </> {} [] () class import export type extends interface".split(" ");

    function resize() {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * DPR);
      canvas.height = Math.floor(height * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      const colWidth = 20;
      const count = Math.ceil(width / colWidth);
      columns.length = 0;
      for (let i = 0; i < count; i++) {
        columns.push({ y: Math.random() * -100 });
      }
    }

    function drawHexNet() {
      const spacing = 60;
      const r = 2;
      ctx.strokeStyle = "rgba(255, 215, 0, 0.15)"; // soft yellow
      ctx.fillStyle = "rgba(255, 215, 0, 0.35)";

      for (let y = -spacing; y < height + spacing; y += spacing * 0.86) {
        for (let x = -spacing; x < width + spacing; x += spacing) {
          const offsetX = ((Math.round(y / (spacing * 0.86)) % 2) ? spacing / 2 : 0);
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
    }

    function drawMatrix() {
      const colWidth = 20;
      ctx.font = "16px Fira Code, monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255, 235, 59, 0.9)"; // yellow

      columns.forEach((col, i) => {
        const x = i * colWidth + colWidth / 2;
        const char = glyphs[Math.floor(Math.random() * glyphs.length)] || "";
        ctx.fillText(char, x, col.y);
        col.y += 18 + Math.random() * 8;
        if (col.y > height + 20) col.y = Math.random() * -200;
      });
    }

    function loop() {
      ctx.clearRect(0, 0, width, height);
      drawHexNet();
      drawMatrix();
      rafRef.current = requestAnimationFrame(loop);
    }

    resize();
    loop();
    window.addEventListener("resize", resize);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
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
        filter: "saturate(0.8) brightness(0.7)",
      }}
    >
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
