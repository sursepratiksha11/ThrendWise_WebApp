

import mongoose, { Schema, model, models } from "mongoose";

const CommentSchema = new Schema(
  {
    articleId: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Comment = models.Comment || model("Comment", CommentSchema);
