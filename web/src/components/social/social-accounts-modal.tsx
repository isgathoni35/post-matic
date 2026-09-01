"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Share2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Trash2,
  RefreshCw,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import {
  getConnectedSocialAccounts,
  getYouTubeAuthUrl,
  disconnectSocialAccount,
  SocialAccount,
} from "@/lib/api";

interface SocialAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

export function SocialAccountsModal({ isOpen, onClose, userId }: SocialAccountsModalProps) {
  const { user } = useAuth();
  const effectiveUserId = userId || user?.id;
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getConnectedSocialAccounts(user?.id);
      setAccounts(data);
    } catch (err: any) {
      console.warn("Failed to load social accounts:", err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      fetchAccounts();
    }
  }, [isOpen, fetchAccounts]);

  if (!isOpen) return null;

  const youtubeAccount = accounts.find((a) => a.platform === "youtube");

  const handleConnectYouTube = async () => {
    setIsConnecting(true);
    toast.info("Connecting to Google OAuth 2.0...", {
      description: "Redirecting to Google Consent Screen for YouTube permissions.",
    });

    try {
      const res = await getYouTubeAuthUrl(user?.id);
      if (res.auth_url) {
        window.location.href = res.auth_url;
      }
    } catch (err: any) {
      toast.error("OAuth Initialization Error", {
        description: err.message || "Failed to initialize YouTube connection.",
      });
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    setIsDeletingId(accountId);
    try {
      await disconnectSocialAccount(accountId, user?.id);
      toast.success("Account Disconnected", {
        description: "YouTube OAuth tokens have been revoked and removed.",
      });
      fetchAccounts();
    } catch (err: any) {
      toast.error("Disconnection Failed", {
        description: err.message || "Could not delete social account record.",
      });
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl studio-card rounded-2xl p-6 sm:p-8 bg-[#0b0e14] border border-white/[0.1] shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black shadow-lg shadow-amber-500/20">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Social Publishing Hub
              </h2>
              <p className="text-xs text-muted-foreground">
                Manage OAuth 2.0 authorizations for autonomous 1-click video publishing.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Channels List */}
        <div className="space-y-4">
          {/* YouTube Integration Card */}
          <div className="rounded-xl p-4 bg-white/[0.02] border border-white/[0.08] space-y-4 hover:border-white/[0.14] transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500">
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-white">YouTube Shorts</span>
                    {youtubeAccount ? (
                      <Badge variant="success" className="text-[10px] font-mono">
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] font-mono">
                        Disconnected
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {youtubeAccount?.account_name
                      ? `Linked to channel: ${youtubeAccount.account_name}`
                      : "Direct API v3 publishing & automated Shorts scheduler."}
                  </p>
                </div>
              </div>

              {youtubeAccount && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDisconnect(youtubeAccount.id)}
                  isLoading={isDeletingId === youtubeAccount.id}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 text-xs"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Disconnect
                </Button>
              )}
            </div>

            {/* Offline Token Security Info */}
            <div className="p-3 rounded-lg bg-black/40 border border-white/[0.04] flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2 text-zinc-400">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Scope: youtube.upload + youtube.readonly</span>
              </div>
              <span className="text-zinc-500 text-[11px]">
                {youtubeAccount?.has_refresh_token ? "Offline Refresh Stored" : "Offline Refresh"}
              </span>
            </div>

            {/* Action CTA */}
            {!youtubeAccount && (
              <Button
                variant="primary"
                className="w-full h-10 text-xs font-semibold"
                onClick={handleConnectYouTube}
                isLoading={isConnecting}
              >
                <Zap className="h-4 w-4 mr-1.5" />
                Authorize YouTube Channel
              </Button>
            )}
          </div>

          {/* TikTok Integration Card (Preview / Future Step) */}
          <div className="rounded-xl p-4 bg-white/[0.01] border border-white/[0.04] space-y-3 opacity-75">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-xs">
                  TT
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-white">TikTok Direct Post</span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      Coming Soon
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Chunked HTTP PUT upload via TikTok Content Posting API.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/[0.08] text-xs text-muted-foreground font-mono">
          <button
            type="button"
            onClick={fetchAccounts}
            className="flex items-center gap-1.5 hover:text-white transition-colors"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
            Re-sync Status
          </button>
          <Button variant="secondary" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
