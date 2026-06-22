import { chromium, devices } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const ROUTES = (process.env.ROUTES ?? "/,/opportunities,/newsletter,/quiz").split(",");
const VIEWPORTS = [
  { name: "iphone-se", ...devices["iPhone SE"] },
  { name: "iphone-14", ...devices["iPhone 14"] },
  { name: "iphone-14pm", ...devices["iPhone 14 Pro Max"] },
];

mkdirSync("screens", { recursive: true });
const browser = await chromium.launch();

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ ...vp, locale: "fr-FR" });
  const page = await ctx.newPage();
  for (const route of ROUTES) {
    await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 60_000 });
    const slug = route.replace(/\W+/g, "_") || "root";
    await page.screenshot({ path: `screens/${vp.name}__${slug}.png`, fullPage: true });
  }
  await ctx.close();
}

await browser.close();
console.log("Captures enregistrées dans screens/");
