import mongoose, { Schema, model, models, Types } from "mongoose";

export interface IArticle {
  _id: Types.ObjectId; // ✅ Explicit!
  title: string;
  slug: string;
  content: string;
}

const ArticleSchema = new Schema<IArticle>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

export const Article = models.Article || model<IArticle>("Article", ArticleSchema);
