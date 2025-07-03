import dbConnect from "@/lib/db";
import { Article } from "@/models/Article";

import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await dbConnect();

  if (req.method === "POST") {
    const { title, slug, content } = req.body;
    await Article.create({ title, slug, content });
    return res.status(201).json({ message: "Article created!" });
  }

  if (req.method === "GET") {
    const articles = await Article.find();
    return res.status(200).json(articles);
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
