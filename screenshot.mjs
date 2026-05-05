import puppeteer from "puppeteer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, "queuebad-thumb.png");

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 720 });

console.log("Loading QueueBad...");
await page.goto("https://xfieldxgod.github.io/QueueBad/", {
  waitUntil: "networkidle2",
  timeout: 30000,
});
await new Promise((r) => setTimeout(r, 2000));

await page.screenshot({ path: outPath, clip: { x: 0, y: 0, width: 1280, height: 720 } });
console.log("Saved:", outPath);

await browser.close();
