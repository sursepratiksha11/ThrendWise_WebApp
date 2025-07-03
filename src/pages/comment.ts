import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/db";
import { Comment } from "@/models/Comment";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  if (req.method === "POST") {
    const { articleId, userName, message } = req.body;

    if (!articleId || !userName || !message) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const comment = await Comment.create({ articleId, userName, message });

    return res.status(201).json(comment);
  }

  if (req.method === "GET") {
    const { articleId } = req.query;

    if (!articleId) {
      return res.status(400).json({ message: "Missing articleId" });
    }

    const comments = await Comment.find({ articleId }).sort({ createdAt: -1 });

    return res.status(200).json(comments);
  }

  return res.status(405).json({ message: "Method not allowed" });
}
