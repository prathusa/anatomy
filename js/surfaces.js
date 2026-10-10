// Shared procedural surface maps. No remote assets: the atlas remains usable offline.
import * as THREE from 'three';

const cache = new Map();
export function surfaceMaps(kind) {
  if (cache.has(kind)) return cache.get(kind);
  const size = 256, canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d'), pixels = ctx.createImageData(size, size);
  const heights = new Float32Array(size * size);
  // Repeatable noise makes every frame and screenshot deterministic.
  let seed = 73;
  const noise = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let h;
    if (kind === 'muscle' || kind === 'tendon') {
      const phase = y * Math.PI * 2 / size;
      h = .5 + .17 * Math.sin(phase * 29 + .45 * Math.sin(x * Math.PI * 2 / size))
        + .08 * Math.sin(phase * 57) + .03 * (noise() - .5);
    } else if (kind === 'brain') {
      h = .5 + .17 * Math.sin(x / size * Math.PI * 12 + 2 * Math.sin(y / size * Math.PI * 8))
        + .08 * Math.cos(y / size * Math.PI * 14);
    } else {
      h = .65 + .12 * (noise() - .5) + .03 * Math.sin(x / size * Math.PI * 8) * Math.sin(y / size * Math.PI * 6);
    }
    heights[y * size + x] = h;
    const k = (y * size + x) * 4;
    const shade = kind === 'muscle' ? 195 + h * 60 : 223 + h * 30;
    pixels.data[k] = pixels.data[k + 1] = pixels.data[k + 2] = shade;
    pixels.data[k + 3] = 255;
  }
  ctx.putImageData(pixels, 0, 0);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  const normalCanvas = document.createElement('canvas'); normalCanvas.width = normalCanvas.height = size;
  const normalCtx = normalCanvas.getContext('2d'), normalPixels = normalCtx.createImageData(size, size);
  const height = (x, y) => heights[((y + size) % size) * size + (x + size) % size];
  const strength = kind === 'brain' ? 5 : kind === 'muscle' ? 3 : .7;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const n = new THREE.Vector3((height(x - 1, y) - height(x + 1, y)) * strength, (height(x, y - 1) - height(x, y + 1)) * strength, 1).normalize();
    const k = (y * size + x) * 4;
    normalPixels.data[k] = (n.x * .5 + .5) * 255;
    normalPixels.data[k + 1] = (n.y * .5 + .5) * 255;
    normalPixels.data[k + 2] = (n.z * .5 + .5) * 255;
    normalPixels.data[k + 3] = 255;
  }
  normalCtx.putImageData(normalPixels, 0, 0);
  const normalMap = new THREE.CanvasTexture(normalCanvas);
  for (const tex of [map, normalMap]) { tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.anisotropy = 4; }
  const maps = { map, normalMap };
  cache.set(kind, maps);
  return maps;
}
