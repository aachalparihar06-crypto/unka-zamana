import React, { useEffect, useRef } from 'react';

export default function SoundWaveEqualizer({ isPlaying }) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const phaseRef = useRef(0);
  const targetEnergyRef = useRef(isPlaying ? 1.0 : 0.1);
  const currentEnergyRef = useRef(isPlaying ? 1.0 : 0.1);

  useEffect(() => {
    targetEnergyRef.current = isPlaying ? 1.0 : 0.1;
  }, [isPlaying]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      // Smooth energy transition between active playing and idle paused
      currentEnergyRef.current += (targetEnergyRef.current - currentEnergyRef.current) * 0.05;
      const energy = currentEnergyRef.current;

      phaseRef.current += isPlaying ? 0.042 : 0.006;
      const phase = phaseRef.current;

      ctx.clearRect(0, 0, width, height);

      // Dynamically calculate golden wave bars across the FULL edge-to-edge width
      const barWidth = 3;
      const gap = 5;
      const step = barWidth + gap;
      const barCount = Math.max(40, Math.floor(width / step));
      const totalSpan = barCount * step;
      const startX = (width - totalSpan) / 2;
      const centerY = height * 0.5;

      for (let i = 0; i < barCount; i++) {
        const x = startX + i * step + (step - barWidth) / 2;
        const norm = i / Math.max(1, barCount - 1); // 0.0 to 1.0 from absolute left to absolute right

        // Multi-frequency harmonic wave formula across full edge-to-edge width
        const w1 = Math.sin(norm * 14 + phase * 2.2);
        const w2 = Math.cos(norm * 28 - phase * 1.5);
        const w3 = Math.sin(norm * 48 + phase * 2.8);
        const w4 = Math.sin(norm * Math.PI); // Envelope smoothly rounded at ends

        const rawAmp = Math.abs(w1 * 0.45 + w2 * 0.35 + w3 * 0.2);
        const maxBarHeight = height * 0.44;
        const minBarHeight = 2;
        const barHeight = minBarHeight + rawAmp * maxBarHeight * (0.35 + 0.65 * w4) * energy;

        const alpha = Math.min(1, 0.35 + energy * 0.6);

        // Shining warm golden gradient matching vintage brass/gold accents
        const barGrad = ctx.createLinearGradient(x, centerY - barHeight, x, centerY + barHeight);
        barGrad.addColorStop(0, `rgba(245, 223, 160, ${alpha * 0.75})`);
        barGrad.addColorStop(0.3, `rgba(240, 192, 96, ${alpha})`);
        barGrad.addColorStop(0.5, `rgba(255, 240, 180, ${alpha})`);
        barGrad.addColorStop(0.7, `rgba(212, 168, 67, ${alpha})`);
        barGrad.addColorStop(1, `rgba(180, 130, 40, ${alpha * 0.75})`);

        ctx.fillStyle = barGrad;
        ctx.shadowColor = `rgba(240, 192, 96, ${0.65 * energy})`;
        ctx.shadowBlur = isPlaying ? 6 : 2;

        const yTop = centerY - barHeight;
        const totalBarHeight = barHeight * 2;

        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, yTop, barWidth, Math.max(2, totalBarHeight), 1.5);
        } else {
          ctx.rect(x, yTop, barWidth, Math.max(2, totalBarHeight));
        }
        ctx.fill();
      }

      // Shining golden horizontal center line spanning full edge-to-edge width
      const axisGrad = ctx.createLinearGradient(0, centerY, width, centerY);
      axisGrad.addColorStop(0, 'rgba(212, 168, 67, 0)');
      axisGrad.addColorStop(0.04, `rgba(212, 168, 67, ${0.45 * energy})`);
      axisGrad.addColorStop(0.5, `rgba(255, 235, 160, ${0.85 * energy})`);
      axisGrad.addColorStop(0.96, `rgba(212, 168, 67, ${0.45 * energy})`);
      axisGrad.addColorStop(1, 'rgba(212, 168, 67, 0)');

      ctx.shadowBlur = isPlaying ? 8 : 2;
      ctx.shadowColor = `rgba(240, 192, 96, ${0.6 * energy})`;
      ctx.fillStyle = axisGrad;
      ctx.fillRect(0, centerY - 0.75, width, 1.5);

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying]);

  return (
    <div className="player-soundwave-wrap" aria-hidden="true">
      <canvas ref={canvasRef} className="player-soundwave-canvas" />
    </div>
  );
}
