import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
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
  title: "Employee Management System",
  description:
    "Employee management and offer letter automation built with Next.js.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("ems-theme")?.value;
  const theme = themeCookie === "dark" || themeCookie === "light" ? themeCookie : "light";

  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-theme={theme}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased ${theme === "dark" ? "dark" : ""}`}
    >
      <body className="min-h-full bg-transparent">
        <div className="flex min-h-screen">
          <AppSidebar initialTheme={theme} />
          <div className="flex min-w-0 flex-1 flex-col">{children}</div>
        </div>
      </body>
    </html>
  );
}
