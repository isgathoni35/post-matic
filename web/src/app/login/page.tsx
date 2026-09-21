"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Film, Mail, Lock, User, Eye, EyeOff, Sparkles, ArrowRight, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandLogo, BrandIcon } from "@/components/ui/brand-logo";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export default function LoginPage() {
  const { user, signInWithEmail, signUpWithEmail, signInWithOAuth } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getRedirectTarget = () => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("next") || params.get("redirect") || "/studio";
    }
    return "/studio";
  };

  // If user is already authenticated, immediately take them to their destination or Studio
  useEffect(() => {
    if (user) {
      window.location.href = getRedirectTarget();
    }
  }, [user]);

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4 text-center">
        <div className="flex flex-col items-center gap-3 animate-in fade-in duration-300">
          <BrandIcon size="lg" glow={false} />
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin text-[#6c5ce7]" />
            <span>Taking you to your studio...</span>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsLoading(true);

    if (mode === "signin") {
      const { error } = await signInWithEmail(email, password);
      setIsLoading(false);
      if (!error) {
        toast.success("Welcome back!");
        window.location.href = getRedirectTarget();
      }
    } else {
      const { error } = await signUpWithEmail(email, password, fullName);
      setIsLoading(false);
      if (!error) {
        toast.success("Account created! Please sign in with your credentials.");
        setMode("signin");
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white text-slate-900 selection:bg-[#6c5ce7]/20 selection:text-[#6c5ce7]">
      {/* Left Feature & Story Panel (Visible on lg+) */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 xl:p-16 border-r border-slate-200/80 bg-[#fafbfe] relative overflow-hidden">
        {/* Background Ambient Glows */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#6c5ce7]/[0.07] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-violet-400/[0.05] rounded-full blur-3xl pointer-events-none" />

        {/* Brand */}
        <div className="z-10">
          <BrandLogo size="lg" badgeText="Studio" />
        </div>

        {/* Middle Value Proposition Callout */}
        <div className="space-y-8 z-10 my-auto max-w-lg">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6c5ce7]/10 border border-[#6c5ce7]/20 text-[#6c5ce7] text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              Creator Autopilot
            </div>
            <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Create viral faceless videos in seconds, not hours.
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Generate high-retention 9:16 Shorts with realistic human narration, matched HD footage, and animated subtitles — ready to publish to YouTube.
            </p>
          </div>

          {/* Feature Highlights List */}
          <div className="space-y-3.5">
            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
              <div className="h-7 w-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">One-Prompt Creation</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                  Type a topic or pick a viral niche. The engine writes scenes and synchronizes visuals automatically.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
              <div className="h-7 w-7 rounded-lg bg-[#6c5ce7]/10 border border-[#6c5ce7]/20 flex items-center justify-center text-[#6c5ce7] shrink-0 mt-0.5">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Hyper-Realistic Voices & Captions</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                  Engaging neural voices paired with kinetic word-by-word subtitles styled for maximum watch-time.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
              <div className="h-7 w-7 rounded-lg bg-[#6c5ce7]/10 border border-[#6c5ce7]/20 flex items-center justify-center text-[#6c5ce7] shrink-0 mt-0.5">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">1-Click Direct to YouTube Shorts</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                  Connect your YouTube channel once. Publish videos with custom titles and hashtags instantly.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-200/80 pt-6 z-10 font-mono">
          <span>Production-grade H.264 1080x1920</span>
          <span>Zero-OpEx Architecture</span>
        </div>
      </div>

      {/* Right Form Console */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16 relative bg-white">
        <div className="max-w-md w-full space-y-6">
          {/* Prominent Back to Home Link */}
          <div className="flex items-center justify-between pb-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 hover:text-slate-900 transition-all group shadow-2xs"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform text-[#6c5ce7]" />
              <span>Back to Home</span>
            </Link>
            <span className="text-[11px] font-mono text-slate-400 font-semibold tracking-wider">POST-MATIC</span>
          </div>

          {/* Header Mobile Brand (lg:hidden) */}
          <div className="flex lg:hidden items-center justify-center mb-4">
            <BrandLogo size="md" badgeText="Studio" />
          </div>

          <div className="space-y-1.5 text-center lg:text-left">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {mode === "signin" ? "Sign in to Studio" : "Create Your Account"}
            </h2>
            <p className="text-xs text-slate-500">
              {mode === "signin"
                ? "Enter your credentials to access your studio workspace and video library."
                : "Create a free account to start creating vertical video content on autopilot."}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 border border-slate-200">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === "signin"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === "signup"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Social OAuth Buttons */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 text-xs font-semibold border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-xs rounded-xl"
              onClick={() => signInWithOAuth("google")}
            >
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.8s.7 5.1 1.9 7.5l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"
                />
              </svg>
              Continue with Google
            </Button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-slate-200" />
            <span className="absolute px-3 bg-white text-[11px] text-slate-400 uppercase font-mono tracking-wider">
              or email
            </span>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Full Name</label>
                <Input
                  type="text"
                  placeholder="Elias Vance"
                  icon={<User className="h-4 w-4" />}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Email Address</label>
              <Input
                type="email"
                placeholder="creator@studio.com"
                required
                icon={<Mail className="h-4 w-4" />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Password</label>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => toast.info("Check your email for reset instructions.")}
                    className="text-[11px] text-[#6c5ce7] font-medium hover:underline"
                  >
                    Forgot?
                  </button>
                )}
              </div>

              <div className="relative flex items-center">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  required
                  icon={<Lock className="h-4 w-4" />}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full h-11 text-xs font-semibold mt-2 rounded-xl"
              isLoading={isLoading}
            >
              {mode === "signin" ? "Sign In to Studio" : "Create Free Account"}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </form>

          {/* Back to Home link */}
          <div className="text-center pt-2">
            <Link
              href="/"
              className="text-xs text-slate-500 hover:text-slate-800 transition-colors"
            >
              ← Back to PostMatic Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
