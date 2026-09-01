"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Film, Mail, Lock, User, Eye, EyeOff, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { user, signInWithEmail, signUpWithEmail, signInWithOAuth } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // If user is already authenticated, allow quick navigation
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090b0e] p-4">
        <div className="studio-card p-8 rounded-2xl max-w-md w-full text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Already Authenticated</h2>
          <p className="text-xs text-muted-foreground">
            You are signed in as <span className="font-mono text-zinc-300">{user.email}</span>.
          </p>
          <Button
            variant="primary"
            className="w-full"
            onClick={() => router.push("/")}
          >
            Go to Studio Console
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
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
        router.push("/");
      }
    } else {
      const { error } = await signUpWithEmail(email, password, fullName);
      setIsLoading(false);
      if (!error) {
        setMode("signin");
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#090b0e] text-zinc-100 selection:bg-amber-500/30 selection:text-amber-200">
      {/* Left Feature & Architecture Panel (Visible on lg+) */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 xl:p-16 border-r border-white/[0.08] bg-[#0b0e14] relative overflow-hidden">
        {/* Background Subtle Gradient */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-amber-500/[0.03] to-transparent pointer-events-none" />

        {/* Brand */}
        <div className="flex items-center gap-3 z-10">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 border border-amber-300/30">
            <Film className="h-5 w-5 text-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white text-lg">POST-MATIC</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20 uppercase">
                Studio
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Automated Short-Form Production Engine</p>
          </div>
        </div>

        {/* Middle Architecture Terminal Callout */}
        <div className="space-y-6 z-10 my-auto">
          <div className="space-y-2">
            <Badge variant="primary" pulse>
              Zero-OpEx Architecture
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight text-white leading-tight">
              Production-grade faceless videos, completely on autopilot.
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Transform single-line prompts into fully edited, voice-narrated, and captioned 9:16 vertical videos with distributed compute.
            </p>
          </div>

          {/* Engine Architecture Terminal */}
          <div className="studio-card rounded-xl p-4 space-y-3 font-mono text-xs text-zinc-300 bg-[#090b0e]/80">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] text-muted-foreground text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                orchestration-pipeline.log
              </span>
              <span>v1.0-fastapi</span>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="text-emerald-400">[0.0s] [LLM] Scripting via Gemini 1.5 JSON schema</div>
              <div className="text-amber-400">[1.2s] [TTS] edge-tts WebSocket word timestamps (.ass)</div>
              <div className="text-sky-400">[2.8s] [Sourcing] Pexels vertical 1080x1920 HD footage</div>
              <div className="text-purple-400">[4.5s] [FFmpeg] Lossless trim, concat & subtitle burning</div>
              <div className="text-zinc-400">[6.1s] [Supabase] Job payload synced & ready</div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-white/[0.06] pt-6 z-10 font-mono">
          <span>FastAPI + Supabase SSR</span>
          <span>H.264 1080x1920 60FPS</span>
        </div>
      </div>

      {/* Right Form Console */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16">
        <div className="max-w-md w-full space-y-8">
          {/* Header Mobile Brand (lg:hidden) */}
          <div className="flex lg:hidden items-center gap-3 justify-center mb-6">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black">
              <Film className="h-5 w-5" />
            </div>
            <span className="font-bold tracking-tight text-white text-lg">POST-MATIC Studio</span>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              {mode === "signin" ? "Sign in to Studio Console" : "Create Studio Account"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {mode === "signin"
                ? "Enter your credentials or sign in with OAuth to manage video jobs."
                : "Sign up to start generating automated vertical content."}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === "signin"
                  ? "bg-white/[0.1] text-white shadow-sm"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === "signup"
                  ? "bg-white/[0.1] text-white shadow-sm"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Social OAuth Buttons */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="secondary"
              className="w-full h-11 text-xs font-medium border border-white/[0.12] hover:bg-white/[0.08]"
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
            <div className="w-full border-t border-white/[0.08]" />
            <span className="absolute px-3 bg-[#090b0e] text-[11px] text-muted-foreground uppercase font-mono tracking-wider">
              or email
            </span>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Full Name</label>
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
              <label className="text-xs font-semibold text-zinc-300">Email Address</label>
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
                <label className="text-xs font-semibold text-zinc-300">Password</label>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => toast.info("Check your email for reset instructions.")}
                    className="text-[11px] text-amber-400 hover:underline"
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
                  className="absolute right-3 text-muted-foreground hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full h-11 text-xs font-semibold mt-2"
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
              className="text-xs text-muted-foreground hover:text-white transition-colors"
            >
              ← Return to Studio Console
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
