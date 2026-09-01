import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/auth-context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "POST-MATIC Studio — Automated Faceless Video SaaS",
  description:
    "Zero-OpEx automated short-form video generation platform powered by Gemini LLM, edge-tts, Pexels, FFmpeg, and Supabase.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#090b0e] text-zinc-100 selection:bg-amber-500/30 selection:text-amber-200">
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            style: {
              background: "#12161f",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              color: "#f3f4f6",
            },
          }}
        />
      </body>
    </html>
  );
}
