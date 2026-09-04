"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Role } from "@/lib/types";

interface Props {
  children: React.ReactNode;
  roles?: Role[];
}

export default function ProtectedRoute({ children, roles }: Props) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
    if (!loading && user && roles && !roles.includes(user.role)) {
      router.push("/");
    }
  }, [user, loading, roles, router]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <p className="text-gray-500">در حال بارگذاری...</p>
      </div>
    );
  }

  if (!user || (roles && !roles.includes(user.role))) {
    return null;
  }

  return <>{children}</>;
}
