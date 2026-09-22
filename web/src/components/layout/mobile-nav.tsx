"use client";

import React, { useState } from "react";
import {
  Video,
  BookOpen,
  Layers,
  Share2,
  Settings,
  Terminal,
  MoreHorizontal,
  X,
  LogOut,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { ActiveWorkspaceView } from "./sidebar";
import { useAuth } from "@/hooks/use-auth";
import { BrandIcon } from "@/components/ui/brand-logo";

interface MobileNavProps {
  activeView: ActiveWorkspaceView;
  onViewChange: (view: ActiveWorkspaceView) => void;
  activeJobsCount?: number;
  completedJobsCount?: number;
}

export function MobileNav({
  activeView,
  onViewChange,
  activeJobsCount = 0,
  completedJobsCount = 0,
}: MobileNavProps) {
  const { user, signOut } = useAuth();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const mainTabs = [
    {
      id: "studio" as ActiveWorkspaceView,
      label: "Studio",
      icon: Sparkles,
    },
    {
      id: "series" as ActiveWorkspaceView,
      label: "Series",
      icon: BookOpen,
    },
    {
      id: "library" as ActiveWorkspaceView,
      label: "Library",
      icon: Video,
      badge: completedJobsCount > 0 ? String(completedJobsCount) : undefined,
    },
    {
      id: "queue" as ActiveWorkspaceView,
      label: "Queue",
      icon: Layers,
      badge: activeJobsCount > 0 ? `${activeJobsCount}` : undefined,
      isPulse: activeJobsCount > 0,
    },
    {
      id: "social" as ActiveWorkspaceView,
      label: "Channels",
      icon: Share2,
    },
  ];

  const handleSelectView = (view: ActiveWorkspaceView) => {
    onViewChange(view);
    setIsMoreOpen(false);
  };

  return (
    <>
      {/* Mobile Slide-Up "More" Sheet */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-50 md:hidden animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsMoreOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 bg-white border-t border-slate-200 rounded-t-2xl p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom-5 duration-200">
            {/* Sheet Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <BrandIcon size="xs" glow={false} />
                <span className="text-sm font-bold text-slate-900 tracking-tight">
                  Workspace Navigation
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation Options */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSelectView("settings")}
                className={`flex items-center gap-3 p-3 rounded-xl text-left text-sm transition-all border ${
                  activeView === "settings"
                    ? "bg-purple-50 text-[#6c5ce7] font-semibold border-purple-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-slate-200/80"
                }`}
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectView("logs")}
                className={`flex items-center gap-3 p-3 rounded-xl text-left text-sm transition-all border ${
                  activeView === "logs"
                    ? "bg-purple-50 text-[#6c5ce7] font-semibold border-purple-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-slate-200/80"
                }`}
              >
                <Terminal className="h-4 w-4" />
                <span>Logs</span>
              </button>
            </div>

            {/* User Account Info & Sign Out */}
            {user && (
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="truncate max-w-[200px]">
                  <p className="text-slate-900 font-semibold truncate">{user.email}</p>
                  <p className="text-[10px] text-slate-500 font-mono">Creator Account</p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await signOut();
                    window.location.href = "/";
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 text-xs font-semibold"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Persistent Bottom Navigation Dock (Mobile Only) */}
      <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200/80 px-2 pt-1.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg">
        <div className="flex items-center justify-around">
          {mainTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeView === tab.id && !isMoreOpen;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelectView(tab.id)}
                className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "text-[#6c5ce7]"
                    : "text-slate-600 hover:text-slate-900 active:scale-95"
                }`}
              >
                <div className="relative">
                  <Icon
                    className={`h-5 w-5 transition-transform ${
                      isActive ? "scale-110 text-[#6c5ce7] stroke-[2.2]" : "text-slate-500"
                    }`}
                  />
                  {tab.badge && (
                    <span
                      className={`absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold leading-tight ${
                        tab.isPulse
                          ? "bg-[#6c5ce7] text-white"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] tracking-tight mt-1 transition-all ${
                    isActive ? "font-bold text-[#6c5ce7]" : "font-semibold text-slate-600"
                  }`}
                >
                  {tab.label}
                </span>

                {/* Subtle active indicator pill */}
                {isActive && (
                  <span className="absolute -bottom-0.5 h-1 w-4 rounded-full bg-[#6c5ce7]" />
                )}
              </button>
            );
          })}

          {/* "More" Trigger */}
          <button
            type="button"
            onClick={() => setIsMoreOpen(true)}
            className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-all duration-200 ${
              isMoreOpen || activeView === "settings" || activeView === "logs"
                ? "text-[#6c5ce7]"
                : "text-slate-600 hover:text-slate-900 active:scale-95"
            }`}
          >
            <MoreHorizontal
              className={`h-5 w-5 transition-transform ${
                isMoreOpen || activeView === "settings" || activeView === "logs"
                  ? "scale-110 text-[#6c5ce7] stroke-[2.2]"
                  : "text-slate-500"
              }`}
            />
            <span
              className={`text-[10px] tracking-tight mt-1 transition-all ${
                isMoreOpen || activeView === "settings" || activeView === "logs"
                  ? "font-bold text-[#6c5ce7]"
                  : "font-semibold text-slate-600"
              }`}
            >
              More
            </span>
            {(activeView === "settings" || activeView === "logs") && !isMoreOpen && (
              <span className="absolute -bottom-0.5 h-1 w-4 rounded-full bg-[#6c5ce7]" />
            )}
          </button>
        </div>
      </nav>
    </>
  );
}
