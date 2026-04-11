import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppSidebar } from "@/components/AppSidebar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  title: "PDF Editor Admin",
  description: "Offer and internship letters: edit sample.pdf, save, and email.",
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
      <body className="min-h-full bg-slate-100 dark:bg-slate-950">
        <div className="flex min-h-screen">
          <AppSidebar />
          <div className="flex min-w-0 flex-1 flex-col">{children}</div>
        </div>
      </body>
    </html>
  );
}
