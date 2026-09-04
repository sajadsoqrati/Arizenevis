import Link from "next/link";
import { serverApi } from "@/lib/api-server";
import { BlogPost, formatDate } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function WeblogPage() {
  let posts: BlogPost[] = [];
  try {
    posts = await serverApi<BlogPost[]>("/api/blog");
  } catch {
    posts = [];
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-center">وبلاگ حقوقی</h1>

      {posts.length === 0 && (
        <p className="text-center text-gray-500">هنوز مقاله‌ای منتشر نشده است.</p>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/weblog/${post.slug}`}
            className="card hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-bold mb-2">{post.title}</h2>
            <p className="text-sm text-gray-500">
              {post.author.fullName} — {formatDate(post.createdAt)}
            </p>
            <p className="text-gray-600 mt-3 line-clamp-3">
              {post.content.slice(0, 200)}...
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
