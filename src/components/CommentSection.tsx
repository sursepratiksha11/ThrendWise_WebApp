"use client";

import { useState, useEffect } from "react";

type Comment = {
  text: string;
  // add other properties if needed
};

export default function CommentSection({ articleId }: { articleId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    fetch(`/api/comment?articleId=${articleId}`)
      .then((res) => res.json())
      .then(setComments);
  }, [articleId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await fetch("/api/comment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleId, text }),
    });
    setText("");
    const res = await fetch(`/api/comment?articleId=${articleId}`);
    const data = await res.json();
    setComments(data);
  };

  return (
    <section className="mt-8">
      <h2 className="text-xl font-bold mb-2">Comments</h2>
      <ul>
        {comments.map((c, idx) => (
          <li key={idx} className="mb-1">{c.text}</li>
        ))}
      </ul>
      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="border p-2 flex-1"
          placeholder="Write your comment..."
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2">Submit</button>
      </form>
    </section>
  );
}
