"use client";

import { Suspense } from "react";
import DashboardContent from "./DashboardContent";

export default function DashboardPage() {
  return (
    <Suspense fallback={<p className="text-gray-500">در حال بارگذاری...</p>}>
      <DashboardContent />
    </Suspense>
  );
}
