const atlasPixels = new WeakMap();
function pixelsFor(image) {
  if (!atlasPixels.has(image)) {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(image, 0, 0);
    atlasPixels.set(image, ctx.getImageData(0, 0, canvas.width, canvas.height));
  }
  return atlasPixels.get(image);
}

// Delphi's SRCAND / SRCPAINT are channel-wise operations, not alpha masks.
// Composite against the current destination at backing-store resolution. Draw
// the result normally so the caller's clip remains effective (putImageData ignores it).
export function drawMaskedSprite(ctx, image, rect, mask, x, y, assetScale = image.assetScale||1) {
  const t = ctx.getTransform();
  if (t.b || t.c || t.a <= 0 || t.d <= 0) throw new Error('Masked sprites require positive axis-aligned scaling');
  const left = Math.max(0, Math.floor(x * t.a + t.e));
  const top = Math.max(0, Math.floor(y * t.d + t.f));
  const right = Math.min(ctx.canvas.width, Math.ceil((x + rect.width) * t.a + t.e));
  const bottom = Math.min(ctx.canvas.height, Math.ceil((y + rect.height) * t.d + t.f));
  const width = right - left, height = bottom - top;
  if (width <= 0 || height <= 0) return;
  const surface = document.createElement('canvas');
  surface.width = width; surface.height = height;
  const c = surface.getContext('2d', { willReadFrequently: true });
  // Sample texel centres explicitly: browser drawImage can sample neighbouring
  // atlas pixels at fractional destinations, even with smoothing disabled.
  const atlas = pixelsFor(image);
  const maskAtlas=pixelsFor(image.maskSource||image),maskScale=image.maskSource?1:assetScale;
  const result = ctx.getImageData(left, top, width, height);
  for (let row = 0; row < height; row++) for (let column = 0; column < width; column++) {
    const u = ((left + column + 0.5 - t.e) / t.a - x) / rect.width;
    const v = ((top + row + 0.5 - t.f) / t.d - y) / rect.height;
    if (u < 0 || u >= 1 || v < 0 || v >= 1) continue;
    const sample = r => 4 * (Math.floor((r.y + v * r.height) * assetScale) * atlas.width
      + Math.floor((r.x + u * r.width) * assetScale));
    const foreground = sample(rect), maskPixel = 4*(Math.floor((mask.y+v*mask.height)*maskScale)*maskAtlas.width+Math.floor((mask.x+u*mask.width)*maskScale));
    const i = 4 * (row * width + column);
    for (let channel = 0; channel < 3; channel++) {
      const maskValue=maskAtlas.data[maskPixel+channel];
      result.data[i + channel] = (result.data[i + channel] & maskValue) | (atlas.data[foreground + channel] & (image.maskSource?255-maskValue:255));
    }
    result.data[i + 3] = 255;
  }
  c.putImageData(result, 0, 0);
  ctx.save();
  ctx.resetTransform();
  ctx.drawImage(surface, left, top);
  ctx.restore();
}
