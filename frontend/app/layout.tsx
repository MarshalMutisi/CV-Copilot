import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Navbar from "@/components/Navbar";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "CV Copilot",
  description: "AI-powered CV and job application assistant",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg-base text-slate-100 font-sans">
        <Navbar />
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 md:py-12">{children}</main>
      </body>
    </html>
  );
}
