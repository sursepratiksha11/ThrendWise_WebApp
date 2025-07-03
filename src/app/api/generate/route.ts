import { NextResponse } from "next/server";
import OpenAI from "openai";
import dbConnect from "../../../lib/db";
// Adjust the import path to the correct relative path if necessary
import Article from "../../../models/Article";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  await dbConnect();
  const { topic } = await req.json();

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are a blog article generator."
      },
      {
        role: "user",
        content: `Write an SEO-optimized blog post about: ${topic}`
      }
    ],
  });

  const content = completion.choices[0].message.content;

  const newArticle = new Article({
    title: topic,
    slug: topic.toLowerCase().replace(/\s+/g, "-"),
    meta: topic,
    content,
  });

  await newArticle.save();

  return NextResponse.json(newArticle);
}
