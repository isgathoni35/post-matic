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
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-8 sm:p-12 text-center max-w-xl mx-auto my-12 space-y-5 animate-in fade-in duration-200">
          <div className="h-14 w-14 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
            <AlertTriangle className="h-7 w-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">
              {this.props.fallbackTitle || "Workspace Error Encountered"}
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
              This workspace view encountered an unexpected issue. Your session and generated videos are safe.
            </p>
            {this.state.error?.message && (
              <p className="font-mono text-[11px] text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 inline-block max-w-md truncate">
                {this.state.error.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={this.handleReset}
              className="text-xs h-9 border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
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
              className="text-xs h-9 font-semibold bg-[#6c5ce7] hover:bg-[#5b4bc4] text-white"
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
