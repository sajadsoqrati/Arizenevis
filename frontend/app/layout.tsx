import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import Navbar from "@/components/Navbar";

const vazir = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-vazir",
});

export const metadata: Metadata = {
  title: "Arizenevis",
  description: "سامانه مشاوره حقوقی آنلاین",
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className={`${vazir.variable} antialiased min-h-screen`}>
        <AuthProvider>
          <Navbar />
          <main className="container mx-auto px-4 py-8 max-w-6xl">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
