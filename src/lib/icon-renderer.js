/**
 * icon-renderer.js
 * Draws the toolbar icon using OffscreenCanvas.
 * Two concentric rings:
 *   Outer ring = Claude 7-day usage (or GPT context %)
 *   Inner ring = Claude 5-hour usage (or empty for GPT)
 *
 * Called from service-worker.js after every usage fetch.
 */

const IconRenderer = {
  colorForPct(pct) {
    if (pct >= TT_CONSTANTS.THRESHOLDS.DANGER)  return TT_CONSTANTS.COLORS.RED;
    if (pct >= TT_CONSTANTS.THRESHOLDS.WARN)    return TT_CONSTANTS.COLORS.YELLOW;
    return TT_CONSTANTS.COLORS.GREEN;
  },

  async render(outerPct, innerPct) {
    const SIZE   = 32;
    const canvas = new OffscreenCanvas(SIZE, SIZE);
    const ctx    = canvas.getContext("2d");
    const cx     = SIZE / 2;
    const cy     = SIZE / 2;

    ctx.clearRect(0, 0, SIZE, SIZE);

    // Background circle
    ctx.beginPath();
    ctx.arc(cx, cy, SIZE / 2 - 1, 0, Math.PI * 2);
    ctx.fillStyle = "#111111";
    ctx.fill();

    // Draw a ring
    function ring(pct, radius, lineWidth, color) {
      const start  = -Math.PI / 2;
      const filled = Math.max(pct / 100, 0.02); // always show stub
      const end    = start + filled * Math.PI * 2;

      // Track
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = TT_CONSTANTS.COLORS.DIM;
      ctx.lineWidth   = lineWidth;
      ctx.stroke();

      // Fill
      ctx.beginPath();
      ctx.arc(cx, cy, radius, start, end);
      ctx.strokeStyle  = color;
      ctx.lineWidth    = lineWidth;
      ctx.lineCap      = "round";
      ctx.stroke();
    }

    // Outer ring — 7-day / context
    ring(outerPct, 12, 4, IconRenderer.colorForPct(outerPct));

    // Inner ring — 5-hour (only meaningful for Claude)
    if (innerPct > 0) {
      ring(innerPct, 6, 3, IconRenderer.colorForPct(innerPct));
    }

    const bitmap = await createImageBitmap(canvas);
    const imageData = ctx.getImageData(0, 0, SIZE, SIZE);

    return {
      imageData: Array.from(imageData.data),
      width: SIZE,
      height: SIZE,
    };
  },
};
