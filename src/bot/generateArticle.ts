import OpenAI from "openai";
import dbConnect from "@/lib/db";
import { Article } from "@/models/Article";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateArticle(topic: string) {
  const prompt = `
  Write an SEO blog article about "${topic}".
  Use H1, H2, meta description, include relevant headings and a conclusion.
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.choices[0].message.content;

  await dbConnect();
  const slug = topic.toLowerCase().replace(/\s+/g, "-");

  await Article.create({
    title: topic,
    slug,
    content,
  });

  console.log(`✅ Saved article: ${topic}`);
}
