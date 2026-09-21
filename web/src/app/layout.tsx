import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "PostMatic — Turn Any Idea into Viral Short-Form Videos",
  description:
    "The autonomous studio for YouTube Shorts, Reels, and TikTok. Create high-retention 9:16 videos with neural narration, 4K B-roll, and kinetic subtitles in 30 seconds.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" },
    ],
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased overflow-x-hidden`}
    >
      <body className="min-h-full flex flex-col bg-white text-slate-900 selection:bg-[#6c5ce7]/20 selection:text-[#6c5ce7] overflow-x-hidden w-full max-w-full relative">
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster
          position="bottom-right"
          theme="light"
          toastOptions={{
            style: {
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              color: "#0f172a",
            },
          }}
        />
      </body>
    </html>
  );
}
