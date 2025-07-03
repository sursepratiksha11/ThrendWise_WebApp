import dbConnect from "@/lib/db";
import { Article, IArticle } from "@/models/Article";
import CommentSection from "@/components/CommentSection";

export const generateMetadata = async ({ params }: { params: { slug: string } }) => {
  const { slug } = params;
  await dbConnect();
  const dbArticle = await Article.findOne({ slug }).lean<IArticle>(); // ✅ Typed!

  if (!dbArticle) {
    return {
      title: "Not Found | TrendWise",
      description: "Article not found."
    };
  }

  return {
    title: dbArticle.title, // ✅ Now TS knows this exists
    description: `Read ${dbArticle.title} - TrendWise`,
    openGraph: {
      title: dbArticle.title,
      description: `Discover trending SEO-optimized content with TrendWise.`,
      url: `/article/${slug}`,
      siteName: "TrendWise",
      type: "article"
    }
  };
};

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  await dbConnect();
  const dbArticle = await Article.findOne({ slug }).lean<IArticle>(); // ✅ Typed!

  if (!dbArticle) return <p>Not found</p>;

  const article = {
    _id: dbArticle._id?.toString?.() ?? "",
    title: dbArticle.title,
    content: dbArticle.content,
  };

  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-2">{article.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: article.content }} />
      <CommentSection articleId={article._id} />
    </main>
  );
}
