/**
 * Recolour only the ropes and rear corner pad in the original reference photo.
 * The output is lossless WebP so every decoded pixel outside the explicit
 * masks remains byte-identical to the decoded source.
 */
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire("c:/Users/sanja/Projects/blue-corner/package.json");
const sharp = require("sharp");

const ROOT = "c:/Users/sanja/Projects/blue-corner-coming-soon-review";
const SOURCE = path.join(ROOT, "assets/art/blue-corner-reference-ring.webp");
const OUTPUT = path.resolve(ROOT, process.argv[2] || "assets/art/blue-corner-reference-ring-brand-v4.webp");

if (path.resolve(SOURCE) === OUTPUT) throw new Error("Refusing to overwrite the original reference image");

const { data, info } = await sharp(SOURCE).raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;
if (width !== 1774 || height !== 887 || channels < 3) {
  throw new Error(`Unexpected source geometry: ${width}x${height} with ${channels} channels`);
}

const pixelCount = width * height;
const output = Buffer.from(data);
const changedMask = new Uint8Array(pixelCount);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (start, end, amount) => start + (end - start) * amount;
const luminance = (r, g, b) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

const colourRamp = (stops, value) => {
  for (let index = 0; index < stops.length - 1; index += 1) {
    const current = stops[index];
    const next = stops[index + 1];
    if (value <= next[0]) {
      const amount = clamp((value - current[0]) / (next[0] - current[0]), 0, 1);
      return current[1].map((channel, channelIndex) => lerp(channel, next[1][channelIndex], amount));
    }
  }
  return stops.at(-1)[1];
};

const YELLOW = [
  [0.08, [92, 73, 12]],
  [0.32, [177, 139, 21]],
  [0.626, [239, 200, 44]],
  [1, [253, 240, 168]],
];

/* The pad reads as the chair back in the frame. Design review 2026-07-26: it
   was matching --brand-navy, which reads as a different, darker blue than the
   wordmark. The base stop is now exactly --brand-blue #197CE3 so the chair and
   the logo are the same colour; the surrounding stops only carry its shading. */
/* Tuned so the DOMINANT pad tone decodes to #197CE3, not the base stop. Most
   pad pixels sit near 0.055 source luminance, i.e. a quarter of the way into
   the 0.035 -> 0.12 span, so the stops are biased down to land the mode on the
   wordmark blue exactly. Verified by sampling the decoded output. */
const PAD_BLUE = [
  [0, [5, 40, 88]],
  [0.035, [16, 116, 222]],
  [0.12, [58, 146, 234]],
  [0.3, [132, 192, 245]],
];

// Each segment follows the photographed rope centreline. Endpoints stop before
// the metal ties and corner pad so hardware and wall pixels cannot be selected.
const ROPE_SEGMENTS = [
  { x1: 0, y1: 182, x2: 1196, y2: 252, halfWidth: 15 },
  { x1: 1372, y1: 249, x2: 1773, y2: 211, halfWidth: 15 },
  { x1: 0, y1: 391, x2: 1197, y2: 360, halfWidth: 15 },
  { x1: 1371, y1: 359, x2: 1773, y2: 379, halfWidth: 15 },
  { x1: 0, y1: 599, x2: 1197, y2: 475, halfWidth: 15 },
  { x1: 1371, y1: 476, x2: 1773, y2: 535, halfWidth: 15 },
  { x1: 0, y1: 777, x2: 1197, y2: 581, halfWidth: 15 },
  { x1: 1371, y1: 581, x2: 1773, y2: 663, halfWidth: 15 },
];

const distanceToSegment = (x, y, segment) => {
  const dx = segment.x2 - segment.x1;
  const dy = segment.y2 - segment.y1;
  const lengthSquared = dx * dx + dy * dy;
  const amount = clamp(((x - segment.x1) * dx + (y - segment.y1) * dy) / lengthSquared, 0, 1);
  return Math.hypot(x - (segment.x1 + amount * dx), y - (segment.y1 + amount * dy));
};

const isRopePixel = (x, y, r, g, b) => {
  const value = luminance(r, g, b);
  const neutralSpread = Math.max(r, g, b) - Math.min(r, g, b);
  if (value < 0.075 || neutralSpread > 52) return false;
  return ROPE_SEGMENTS.some((segment) => distanceToSegment(x, y, segment) <= segment.halfWidth);
};

// Tight polygon around the rear pad. It ends above the stool seat and excludes
// the rope ties on either side.
const PAD_POLYGON = [
  [1216, 201],
  [1351, 199],
  [1357, 205],
  [1357, 544],
  [1351, 550],
  [1214, 550],
  [1208, 544],
  [1208, 208],
];

const isInsidePolygon = (x, y, polygon) => {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
    const [xi, yi] = polygon[index];
    const [xj, yj] = polygon[previous];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

let ropePixels = 0;
let padPixels = 0;
for (let y = 0; y < height; y += 1) {
  for (let x = 0; x < width; x += 1) {
    const pixel = y * width + x;
    const offset = pixel * channels;
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];
    const value = luminance(r, g, b);

    let colour = null;
    if (isInsidePolygon(x + 0.5, y + 0.5, PAD_POLYGON)) {
      colour = colourRamp(PAD_BLUE, value);
      changedMask[pixel] = 2;
      padPixels += 1;
    } else if (isRopePixel(x, y, r, g, b)) {
      colour = colourRamp(YELLOW, value);
      changedMask[pixel] = 1;
      ropePixels += 1;
    }

    if (!colour) continue;
    output[offset] = Math.round(clamp(colour[0], 0, 255));
    output[offset + 1] = Math.round(clamp(colour[1], 0, 255));
    output[offset + 2] = Math.round(clamp(colour[2], 0, 255));
  }
}

if (ropePixels < 100_000 || padPixels < 40_000) {
  throw new Error(`Mask coverage is unexpectedly small: ${ropePixels} rope, ${padPixels} pad pixels`);
}

await sharp(output, { raw: { width, height, channels } })
  .webp({ lossless: true, effort: 6 })
  .toFile(OUTPUT);

const rebuilt = await sharp(OUTPUT).raw().toBuffer({ resolveWithObject: true });
if (rebuilt.info.width !== width || rebuilt.info.height !== height || rebuilt.info.channels !== channels) {
  throw new Error("Lossless output geometry or channel count changed");
}
for (let pixel = 0; pixel < pixelCount; pixel += 1) {
  if (changedMask[pixel]) continue;
  const offset = pixel * channels;
  for (let channel = 0; channel < channels; channel += 1) {
    if (rebuilt.data[offset + channel] !== data[offset + channel]) {
      throw new Error(`Unmasked decoded pixel changed at ${pixel} channel ${channel}`);
    }
  }
}

console.log(`wrote ${OUTPUT} ${width}x${height}; rope=${ropePixels}, pad=${padPixels}; unmasked pixels verified identical`);
