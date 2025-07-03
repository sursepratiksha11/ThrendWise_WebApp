import dbConnect from "@/lib/db";
import { Comment } from "@/models/Comment";

import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await dbConnect();

  if (req.method === "POST") {
    const { articleId, text } = req.body;
    await Comment.create({ article: articleId, text });
    return res.status(201).json({ message: "Comment added!" });
  }

  if (req.method === "GET") {
    const { articleId } = req.query;
    const comments = await Comment.find({ article: articleId }).sort({ createdAt: -1 });
    return res.status(200).json(comments);
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
