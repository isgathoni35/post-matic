"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class WorkspaceErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("WorkspaceErrorBoundary caught an error:", error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-3xl border border-rose-500/20 bg-[#0f131a] p-8 sm:p-12 text-center max-w-xl mx-auto my-12 shadow-2xl space-y-5 animate-in fade-in duration-200">
          <div className="h-14 w-14 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 mx-auto shadow-lg shadow-rose-500/10">
            <AlertTriangle className="h-7 w-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold text-white">
              {this.props.fallbackTitle || "Workspace Error Encountered"}
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-md mx-auto">
              This workspace view encountered an unexpected issue. Your session and generated videos are safe.
            </p>
            {this.state.error?.message && (
              <p className="font-mono text-[11px] text-rose-400/90 bg-rose-950/30 px-3 py-1.5 rounded-lg border border-rose-900/40 inline-block max-w-md truncate">
                {this.state.error.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={this.handleReset}
              className="text-xs h-9 bg-white/[0.04] border-white/[0.08]"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Try Again
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                if (typeof window !== "undefined") {
                  localStorage.setItem("postmatic_active_view", "studio");
                }
                if (this.props.onReset) {
                  this.props.onReset();
                } else {
                  window.location.href = "/studio";
                }
              }}
              className="text-xs h-9 font-semibold"
            >
              <Home className="h-3.5 w-3.5 mr-1.5" />
              Return to Studio Console
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
