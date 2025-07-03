"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function CommentList({ articleId }: { articleId: string }) {
  const { data, error } = useSWR(`/api/comment?articleId=${articleId}`, fetcher);

  if (error) return <div>Failed to load comments</div>;
  if (!data) return <div>Loading comments...</div>;

  return (
    <div>
      {data.map((comment: any) => (
        <div key={comment._id} className="border-b py-2">
          <p className="text-gray-800">{comment.content}</p>
          <p className="text-sm text-gray-500">{comment.userEmail}</p>
        </div>
      ))}
    </div>
  );
}
