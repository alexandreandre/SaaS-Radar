import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC_MARK = path.join(ROOT, "assets/brand/logo-mark-source.png");
const OUT_DIR = path.join(ROOT, "public/brand");

function findContentBounds(data, width, height, channels) {
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (lum < 240) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }

  return { minX, minY, maxX, maxY };
}

/** Recadre serré, fond transparent, variantes claire (noir) et sombre (blanc). */
async function processMark(inputPath, baseName) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const { minX, minY, maxX, maxY } = findContentBounds(data, width, height, channels);
  const contentW = maxX - minX + 1;
  const contentH = maxY - minY + 1;
  const pad = Math.round(Math.max(contentW, contentH) * 0.06);

  const cropped = await sharp(inputPath)
    .extract({
      left: Math.max(0, minX - pad),
      top: Math.max(0, minY - pad),
      width: Math.min(width, contentW + pad * 2),
      height: Math.min(height, contentH + pad * 2),
    })
    .png()
    .toBuffer();

  const { data: px, info: croppedInfo } = await sharp(cropped)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const cw = croppedInfo.width;
  const ch = croppedInfo.height;
  const light = Buffer.alloc(px.length);
  const dark = Buffer.alloc(px.length);

  for (let i = 0; i < px.length; i += channels) {
    const lum = (px[i] + px[i + 1] + px[i + 2]) / 3;
    const opaque = lum < 200;

    light[i] = 0;
    light[i + 1] = 0;
    light[i + 2] = 0;
    light[i + 3] = opaque ? 255 : 0;

    dark[i] = 255;
    dark[i + 1] = 255;
    dark[i + 2] = 255;
    dark[i + 3] = opaque ? 255 : 0;
  }

  const raw = { width: cw, height: ch, channels: 4 };
  await sharp(light, { raw }).png().toFile(path.join(OUT_DIR, `${baseName}-light.png`));
  await sharp(dark, { raw }).png().toFile(path.join(OUT_DIR, `${baseName}-dark.png`));

  console.log(`${baseName}: ${cw}x${ch}px (crop ${contentW}x${contentH})`);
}

await mkdir(OUT_DIR, { recursive: true });
await processMark(SRC_MARK, "logo-mark");
console.log("Done → public/brand/");
