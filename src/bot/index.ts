import { fetchGoogleTrends } from "./fetchTrends";
import { generateArticle } from "./generateArticle";

export async function runBot() {
  const trends = await fetchGoogleTrends();
  for (const trend of trends) {
    if (typeof trend === "string") {
      await generateArticle(trend);
    }
  }
}

runBot().then(() => {
  console.log("✅ TrendWise Bot Done");
});
