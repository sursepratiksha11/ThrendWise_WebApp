import dbConnect from "@/lib/db";
import { Article } from "@/models/Article";
import Link from "next/link";

export default async function HomePage() {
  await dbConnect();
  const articles = await Article.find().lean();

  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">All Articles</h1>
      <ul>
        {articles.map((article) => (
          <li key={article._id as string}>
            <Link href={`/article/${article.slug}`}>
              <span className="text-blue-600 underline">{article.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
