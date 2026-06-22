import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SVG = path.join(ROOT, "assets/brand/logo-mark.svg");
const OUT_DIR = path.join(ROOT, "public/brand");

async function buildVariants() {
  const svg = await readFile(SVG);
  const { data, info } = await sharp(svg)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const light = Buffer.alloc(data.length);
  const dark = Buffer.alloc(data.length);

  for (let i = 0; i < data.length; i += channels) {
    const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
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

  const raw = { width, height, channels: 4 };
  await sharp(light, { raw }).png().toFile(path.join(OUT_DIR, "logo-mark-light.png"));
  await sharp(dark, { raw }).png().toFile(path.join(OUT_DIR, "logo-mark-dark.png"));

  await sharp(dark, { raw })
    .resize(32, 32, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(ROOT, "public/favicon-32.png"));

  await sharp(dark, { raw })
    .resize(180, 180, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(ROOT, "public/apple-touch-icon.png"));

  console.log(`logo-mark: ${width}x${height}px → public/brand/`);
}

await mkdir(OUT_DIR, { recursive: true });
await buildVariants();
