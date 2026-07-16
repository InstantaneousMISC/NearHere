import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

async function main() {
  const possiblePaths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ];

  let executablePath = "";
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      executablePath = p;
      break;
    }
  }

  if (!executablePath) {
    console.error("❌ Could not find Chrome or Edge executable!");
    process.exit(1);
  }

  console.log(`🚀 Launching browser using: ${executablePath}`);
  const browser = await puppeteer.launch({
    executablePath,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const artifactDir = "C:\\Users\\jcabe\\.gemini\\antigravity\\brain\\d9e02bfb-5b4d-4593-a332-fed2ec4a205a";
  const url = "http://localhost:3000/campaigns/tx/converse/valcron-camp-valcron-1782503632738/contact";

  console.log(`🌐 Navigating to ${url}...`);
  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
    const imgPath = path.join(artifactDir, "contact_page.png");
    await page.screenshot({ path: imgPath, fullPage: false });
    console.log(`📸 Saved screenshot to ${imgPath}`);
  } catch (e) {
    console.error(`❌ Failed to load ${url}:`, e);
  }

  await browser.close();
  console.log("🎉 Screenshot captured successfully.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
