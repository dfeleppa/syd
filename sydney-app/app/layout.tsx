import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "../components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mission Control",
  description: "Your personal mission control for health, work, and agents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#ffe4ec_0,#f9f3eb_38%,#f5eadf_68%,#f1e0d4_100%)] text-slate-900">
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 min-h-screen px-4 py-6 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-6xl space-y-6">{children}</div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
