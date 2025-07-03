import puppeteer from "puppeteer";

export async function fetchGoogleTrends() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("https://trends.google.com/trends/trendingsearches/daily?geo=US");

  // Scrape trending topics
  const topics = await page.$$eval('.details-top', els =>
    els.map(el => el.textContent?.trim()).filter(Boolean)
  );

  await browser.close();
  return topics;
}
