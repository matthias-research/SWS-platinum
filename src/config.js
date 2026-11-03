// All layout remains in Delphi logical coordinates. Never multiply individual positions.
export const DISPLAY = Object.freeze({
  scale: 2,
  fitToWindow: true,
  width: 768,
  height: 528,
});

const asset = name => `${import.meta.env.BASE_URL}assets/${name}`;
export const ASSETS = Object.freeze({
  enhanced: { url: asset('table-enhanced-2x.png'), scale: 2 },
  original: { url: asset('table-original.bmp'), scale: 1 },
  pieces: { url: asset('schieber-pieces.bmp'), scale: 1 },
  manifest: asset('schieber-pieces.json'),
  differOriginal: { url: asset('differ-table-original.bmp'), scale: 1 },
  differEnhanced: { url: asset('differ-table-enhanced-2x.png'), scale: 2 },
});

export function fitScale(availableWidth, availableHeight, requestedScale, fit) {
  return fit ? Math.min(requestedScale, Math.max(1, availableWidth) / DISPLAY.width,
    Math.max(1, availableHeight) / DISPLAY.height) : requestedScale;
}

export function toLogicalPoint(clientX, clientY, bounds) {
  return { x: (clientX - bounds.left) * DISPLAY.width / bounds.width,
    y: (clientY - bounds.top) * DISPLAY.height / bounds.height };
}
