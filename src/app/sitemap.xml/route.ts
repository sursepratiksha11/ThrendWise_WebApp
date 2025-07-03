import dbConnect from "@/lib/db";
import { Article } from "@/models/Article";

export async function GET() {
  await dbConnect();

  const articles = await Article.find().lean();

  const urls = articles
    .map(
      (article) =>
        `<url><loc>${process.env.NEXT_PUBLIC_SITE_URL}/article/${article.slug}</loc></url>`
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}