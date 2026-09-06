import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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
      <body
        className={`${vazir.variable} flex min-h-screen flex-col antialiased`}
      >
        <AuthProvider>
          <Navbar />
          <main className="container mx-auto flex-1 px-4 py-8 max-w-6xl">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
