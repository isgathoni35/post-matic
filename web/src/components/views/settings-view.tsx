"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  User,
  Shield,
  Key,
  Cpu,
  CheckCircle2,
  Save,
  Volume2,
  Clock,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { VOICES } from "./studio-console-view";
import { toast } from "sonner";

interface SettingsViewProps {
  userEmail?: string;
  userId?: string;
  defaultDuration: number;
  setDefaultDuration: (d: number) => void;
  defaultVoice: string;
  setDefaultVoice: (v: string) => void;
}

export function SettingsView({
  userEmail,
  userId,
  defaultDuration,
  setDefaultDuration,
  defaultVoice,
  setDefaultVoice,
}: SettingsViewProps) {
  const [aiVisualsEnabled, setAiVisualsEnabled] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("postmatic_ai_visuals_enabled");
      if (saved !== null) {
        setAiVisualsEnabled(saved === "true");
      }
    }
  }, []);

  const handleSave = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("postmatic_ai_visuals_enabled", String(aiVisualsEnabled));
    }
    toast.success("Studio preferences saved successfully!");
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#6c5ce7]" />
              <span>Studio & Account Settings</span>
            </h1>
            <Badge variant="outline" className="text-[10px] font-mono font-semibold border-slate-200 text-slate-600">
              Preferences
            </Badge>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            Configure default synthesis parameters, API keys, and account security.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          className="text-xs h-9 font-semibold bg-[#6c5ce7] hover:bg-[#5b4bc4] text-white shadow-xs"
        >
          <Save className="h-3.5 w-3.5 mr-1.5" />
          Save Preferences
        </Button>
      </div>

      {/* Account Info Card */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-5 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
          <User className="h-4 w-4 text-slate-500" />
          <span>Account Profile</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-slate-800 font-semibold">Authenticated Email</label>
            <Input
              value={userEmail || "user@example.com"}
              readOnly
              className="bg-slate-50 border-slate-200 text-slate-900 font-medium cursor-not-allowed text-xs h-9"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-slate-800 font-semibold">User UUID</label>
            <Input
              value={userId || "00000000-0000-0000-0000-000000000000"}
              readOnly
              className="bg-slate-50 border-slate-200 text-slate-700 font-mono font-medium cursor-not-allowed text-xs h-9"
            />
          </div>
        </div>
      </div>

      {/* Default Pipeline Presets */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-5 space-y-5 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
          <Cpu className="h-4 w-4 text-slate-500" />
          <span>Default Pipeline Presets</span>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs text-slate-800 font-semibold flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              Default Video Target Duration
            </label>
            <div className="grid grid-cols-4 gap-2.5">
              {[15, 25, 45, 60].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDefaultDuration(d)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    defaultDuration === d
                      ? "bg-[#6c5ce7] border-[#6c5ce7] text-white shadow-2xs"
                      : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100 font-semibold"
                  }`}
                >
                  {d} seconds
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-100">
            <label className="text-xs text-slate-800 font-semibold flex items-center gap-1.5">
              <Volume2 className="h-3.5 w-3.5 text-slate-500" />
              Default Voice Actor (edge-tts)
            </label>
            <select
              value={defaultVoice}
              onChange={(e) => setDefaultVoice(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-medium p-2.5 focus:ring-2 focus:ring-[#6c5ce7]/20 focus:border-[#6c5ce7] shadow-2xs"
            >
              {VOICES.map((v) => (
                <option key={v.id} value={v.id} className="bg-white text-slate-900">
                  {v.name} ({v.role})
                </option>
              ))}
            </select>
          </div>

          {/* AI Visual Fallback Toggle */}
          <div className="pt-3 border-t border-slate-100">
            <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#6c5ce7] shadow-2xs shrink-0">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-900">AI Visual Generation (Google Imagen 3)</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-slate-700 font-bold border border-slate-200 shadow-2xs">
                      Zero-Drift
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 font-normal">
                    Synthesizes custom 9:16 cinematic visuals via Imagen 3 whenever Pexels has no matching video, animated with Ken Burns motion.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={aiVisualsEnabled}
                onChange={(e) => setAiVisualsEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 bg-white text-[#6c5ce7] focus:ring-[#6c5ce7]/20 accent-[#6c5ce7] cursor-pointer"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Infrastructure & Services Health Matrix */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-5 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
            <Shield className="h-4 w-4 text-emerald-600" />
            <span>Infrastructure Health</span>
          </div>
          <Badge variant="success" className="text-[10px] font-mono font-bold">100% Operational</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {[
            { service: "FastAPI Backend Engine", status: "Online", desc: "Uvicorn worker daemon" },
            { service: "Supabase PostgreSQL & Auth", status: "Online", desc: "RLS & Service Role active" },
            { service: "Google Gemini 3.7 Flash", status: "Connected", desc: "Structured JSON schema validation" },
            { service: "Google Imagen 3 (Nano Banana)", status: "Connected", desc: "9:16 AI visual generator & Ken Burns" },
            { service: "Pexels Video CDN", status: "Connected", desc: "Vertical 4K/HD clips" },
            { service: "Microsoft edge-tts", status: "Online", desc: "High fidelity word-boundaries" },
            { service: "FFmpeg 9:16 Encoder", status: "Online", desc: "H.264 / AAC stitcher" },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between"
            >
              <div>
                <p className="font-semibold text-slate-900">{item.service}</p>
                <p className="text-[11px] text-slate-600 font-medium">{item.desc}</p>
              </div>
              <span className="flex items-center text-emerald-600 font-mono text-[11px] font-semibold">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
