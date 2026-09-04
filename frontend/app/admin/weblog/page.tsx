"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { api, ApiError } from "@/lib/api";
import { BlogPost, formatDate } from "@/lib/types";

const blogSchema = z.object({
  title: z.string().min(3),
  content: z.string().min(10),
  published: z.boolean().optional(),
});

export default function AdminWeblogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [message, setMessage] = useState("");

  const form = useForm({
    resolver: zodResolver(blogSchema),
    defaultValues: { published: false },
  });

  const loadPosts = () => {
    api<BlogPost[]>("/api/admin/blog").then(setPosts).catch(() => {});
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const onSubmit = async (data: z.infer<typeof blogSchema>) => {
    try {
      await api("/api/admin/blog", {
        method: "POST",
        body: JSON.stringify(data),
      });
      form.reset();
      setMessage("مقاله ایجاد شد");
      loadPosts();
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "خطا");
    }
  };

  const togglePublish = async (id: string, published: boolean) => {
    await api(`/api/admin/blog/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ published: !published }),
    });
    loadPosts();
  };

  const deletePost = async (id: string) => {
    if (!confirm("آیا مطمئن هستید؟")) return;
    await api(`/api/admin/blog/${id}`, { method: "DELETE" });
    loadPosts();
  };

  return (
    <ProtectedRoute roles={["ADMIN"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">مدیریت وبلاگ</h1>
          <Link href="/admin" className="btn-secondary text-sm">
            بازگشت به پنل
          </Link>
        </div>

        {message && (
          <div className="bg-green-50 text-green-700 p-3 rounded-xl text-sm">
            {message}
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="card space-y-4">
          <h2 className="font-bold">مقاله جدید</h2>
          <input placeholder="عنوان" {...form.register("title")} className="input-field" />
          <textarea
            placeholder="متن مقاله"
            rows={8}
            {...form.register("content")}
            className="input-field resize-none"
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...form.register("published")} />
            منتشر شود
          </label>
          <button type="submit" className="btn-primary">ایجاد مقاله</button>
        </form>

        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="card flex flex-wrap justify-between items-center gap-3">
              <div>
                <h3 className="font-bold">{post.title}</h3>
                <p className="text-xs text-gray-400">{formatDate(post.createdAt)}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => togglePublish(post.id, post.published)}
                  className="btn-secondary text-sm"
                >
                  {post.published ? "پیش‌نویس" : "انتشار"}
                </button>
                <button
                  onClick={() => deletePost(post.id)}
                  className="text-red-600 text-sm hover:underline cursor-pointer"
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  );
}
