import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sweatshirt",
  description: "Sweatshirt — interview prep tracker for software engineers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 relative">
        {/* Ambient warm glow behind everything — subtle in light mode, more visible in dark */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_70%_60%_at_85%_-10%,rgba(251,146,60,0.10),transparent_60%),radial-gradient(ellipse_50%_50%_at_10%_110%,rgba(245,158,11,0.06),transparent_70%)] dark:bg-[radial-gradient(ellipse_70%_60%_at_85%_-10%,rgba(251,146,60,0.18),transparent_60%),radial-gradient(ellipse_50%_50%_at_10%_110%,rgba(245,158,11,0.08),transparent_70%)]"
        />
        <Nav />
        <main className="flex-1 overflow-y-auto p-8 relative">{children}</main>
      </body>
    </html>
  );
}
