import Link from "next/link";

export default function ArticleCard({ article }: any) {
  return (
    <Link href={`/article/${article.slug}`} className="block p-4 border rounded">
      <h2 className="text-xl font-semibold">{article.title}</h2>
      <p>{article.meta}</p>
    </Link>
  );
}
