import "./globals.css";
import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { QueryProvider } from "@/components/providers/query-provider";

const sans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const mono = Roboto_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Battle Farm Saga",
  description: "Web-based text RPG rebuilt with Next.js, Zustand, and Supabase-ready saves.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sans.variable} ${mono.variable} min-h-screen bg-black text-white antialiased`}>
        <QueryProvider>
          <div className="relative min-h-screen overflow-hidden bg-linear-to-b from-black via-black to-emerald-950">
            <div className="pointer-events-none absolute inset-0">
              <div
                className="absolute inset-0 opacity-40"
                style={{ backgroundImage: "url(/assets/field-grid.svg)", backgroundSize: "60px" }}
              />
            </div>
            <main className="relative z-10 mx-auto w-full max-w-5xl px-4 py-10 sm:px-8 lg:py-16">
              {children}
            </main>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
