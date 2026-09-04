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
  Info,
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
      const data = await getConnectedSocialAccounts(effectiveUserId);
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
      const res = await getYouTubeAuthUrl(effectiveUserId);
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
      await disconnectSocialAccount(accountId, effectiveUserId);
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
                Manage autonomous multi-channel distribution integrations.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Accounts List */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* YouTube Integration Card */}
          <div className="rounded-xl p-4 bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 font-bold text-xs">
                  YT
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-white">YouTube Shorts</span>
                    {youtubeAccount ? (
                      <Badge variant="default" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                        <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">
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
              <div className="space-y-2">
                <Button
                  variant="primary"
                  className="w-full h-10 text-xs font-semibold"
                  onClick={handleConnectYouTube}
                  isLoading={isConnecting}
                >
                  <Zap className="h-4 w-4 mr-1.5" />
                  Authorize YouTube Channel
                </Button>
                <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 text-[11px] text-zinc-400 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-amber-400 font-medium">
                    <Info className="h-3.5 w-3.5" />
                    <span>Google Cloud Console Setup Checklist</span>
                  </div>
                  <p className="text-zinc-400 leading-relaxed">
                    If Google displays <em>&ldquo;This request is invalid (Error 400)&rdquo;</em>:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-zinc-400 pl-1">
                    <li>
                      Authorized redirect URI must include: <br />
                      <code className="text-amber-300 font-mono text-[10px] bg-black/50 px-1 py-0.5 rounded select-all">
                        http://localhost:8000/api/social/youtube/callback
                      </code>
                    </li>
                    <li>
                      Your Google/YouTube email must be added under <strong>OAuth consent screen &gt; Test users</strong>.
                    </li>
                  </ul>
                </div>
              </div>
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
