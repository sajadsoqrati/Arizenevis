import Link from "next/link";
import { notFound } from "next/navigation";
import { serverApi } from "@/lib/api-server";
import { BlogPost, formatDate } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let post: BlogPost;

  try {
    post = await serverApi<BlogPost>(`/api/blog/${slug}`);
  } catch {
    notFound();
  }

  return (
    <article className="max-w-3xl mx-auto space-y-6">
      <Link href="/weblog" className="text-primary-light text-sm hover:underline">
        ← بازگشت به وبلاگ
      </Link>

      <h1 className="text-3xl font-bold">{post.title}</h1>
      <p className="text-sm text-gray-500">
        {post.author.fullName} — {formatDate(post.createdAt)}
      </p>

      <div className="card prose prose-lg max-w-none whitespace-pre-wrap leading-relaxed">
        {post.content}
      </div>
    </article>
  );
}
