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
  getTikTokAuthUrl,
  getInstagramAuthUrl,
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
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
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
  }, [effectiveUserId]);

  useEffect(() => {
    if (isOpen) {
      fetchAccounts();
    }
  }, [isOpen, fetchAccounts]);

  if (!isOpen) return null;

  const youtubeAccount = accounts.find((a) => a.platform === "youtube");
  const tiktokAccount = accounts.find((a) => a.platform === "tiktok");
  const instagramAccount = accounts.find((a) => a.platform === "instagram");

  const handleConnectYouTube = async () => {
    setConnectingPlatform("youtube");
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
      setConnectingPlatform(null);
    }
  };

  const handleConnectTikTok = async () => {
    setConnectingPlatform("tiktok");
    toast.info("Connecting to TikTok Login Kit...", {
      description: "Redirecting to TikTok OAuth consent screen.",
    });

    try {
      const res = await getTikTokAuthUrl(effectiveUserId);
      if (res.auth_url) {
        window.location.href = res.auth_url;
      }
    } catch (err: any) {
      toast.error("TikTok Initialization Error", {
        description: err.message || "Failed to initialize TikTok connection. Check TIKTOK_CLIENT_KEY in .env.",
      });
      setConnectingPlatform(null);
    }
  };

  const handleConnectInstagram = async () => {
    setConnectingPlatform("instagram");
    toast.info("Connecting to Meta / Instagram...", {
      description: "Redirecting to Meta OAuth screen for Instagram Reels publishing permissions.",
    });

    try {
      const res = await getInstagramAuthUrl(effectiveUserId);
      if (res.auth_url) {
        window.location.href = res.auth_url;
      }
    } catch (err: any) {
      toast.error("Instagram Initialization Error", {
        description: err.message || "Failed to initialize Instagram connection. Check META_APP_ID in .env.",
      });
      setConnectingPlatform(null);
    }
  };

  const handleDisconnect = async (accountId: string, platformLabel: string) => {
    setIsDeletingId(accountId);
    try {
      await disconnectSocialAccount(accountId, effectiveUserId);
      toast.success("Account Disconnected", {
        description: `${platformLabel} OAuth tokens have been revoked and removed.`,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto pm-surface-raised rounded-2xl p-4 sm:p-8 border border-white/[0.1] shadow-2xl space-y-5 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Social Publishing Hub
              </h2>
              <p className="text-xs text-muted-foreground">
                Connect YouTube, TikTok, and Instagram for automated multi-channel video distribution.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Accounts List */}
        <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
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
                  onClick={() => handleDisconnect(youtubeAccount.id, "YouTube")}
                  isLoading={isDeletingId === youtubeAccount.id}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 text-xs"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Disconnect
                </Button>
              )}
            </div>

            <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.04] flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2 text-zinc-400">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Scope: youtube.upload</span>
              </div>
              <span className="text-zinc-500 text-[11px]">
                {youtubeAccount?.has_refresh_token ? "Offline Refresh Stored" : "OAuth 2.0"}
              </span>
            </div>

            {!youtubeAccount && (
              <div className="space-y-2">
                <Button
                  variant="primary"
                  className="w-full h-9 text-xs font-semibold"
                  onClick={handleConnectYouTube}
                  isLoading={connectingPlatform === "youtube"}
                >
                  <Zap className="h-4 w-4 mr-1.5" />
                  Authorize YouTube Channel
                </Button>
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] text-zinc-400 space-y-1">
                  <span className="text-zinc-400 font-medium flex items-center gap-1">
                    <Info className="h-3 w-3" /> Callback URI:
                  </span>
                  <code className="text-zinc-300 font-mono text-[10px] bg-black/50 px-1 py-0.5 rounded select-all block">
                    http://localhost:8000/api/social/youtube/callback
                  </code>
                </div>
              </div>
            )}
          </div>

          {/* TikTok Integration Card */}
          <div className="rounded-xl p-4 bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-xs">
                  TT
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-white">TikTok Direct Post</span>
                    {tiktokAccount ? (
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
                    {tiktokAccount?.account_name
                      ? `Linked to account: ${tiktokAccount.account_name}`
                      : "Direct video publishing via TikTok Content Posting API."}
                  </p>
                </div>
              </div>

              {tiktokAccount && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDisconnect(tiktokAccount.id, "TikTok")}
                  isLoading={isDeletingId === tiktokAccount.id}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 text-xs"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Disconnect
                </Button>
              )}
            </div>

            <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.04] flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2 text-zinc-400">
                <ShieldCheck className="h-4 w-4 text-cyan-400" />
                <span>Scope: video.publish, video.upload</span>
              </div>
              <span className="text-zinc-500 text-[11px]">
                {tiktokAccount?.has_refresh_token ? "Refresh Token Stored" : "Content Posting API"}
              </span>
            </div>

            {!tiktokAccount && (
              <div className="space-y-2">
                <Button
                  variant="primary"
                  className="w-full h-9 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white"
                  onClick={handleConnectTikTok}
                  isLoading={connectingPlatform === "tiktok"}
                >
                  <Zap className="h-4 w-4 mr-1.5" />
                  Authorize TikTok Account
                </Button>
                <div className="p-2.5 rounded-lg bg-cyan-500/5 border border-cyan-500/10 text-[11px] text-zinc-400 space-y-1">
                  <span className="text-cyan-400 font-medium flex items-center gap-1">
                    <Info className="h-3 w-3" /> TikTok Callback URI:
                  </span>
                  <code className="text-cyan-300 font-mono text-[10px] bg-black/50 px-1 py-0.5 rounded select-all block">
                    http://localhost:8000/api/social/tiktok/callback
                  </code>
                </div>
              </div>
            )}
          </div>

          {/* Instagram Reels Integration Card */}
          <div className="rounded-xl p-4 bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 font-bold text-xs">
                  IG
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-white">Instagram Reels</span>
                    {instagramAccount ? (
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
                    {instagramAccount?.account_name
                      ? `Linked to account: ${instagramAccount.account_name}`
                      : "Publish Reels to Instagram Professional / Creator accounts."}
                  </p>
                </div>
              </div>

              {instagramAccount && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDisconnect(instagramAccount.id, "Instagram")}
                  isLoading={isDeletingId === instagramAccount.id}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 text-xs"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Disconnect
                </Button>
              )}
            </div>

            <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.04] flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2 text-zinc-400">
                <ShieldCheck className="h-4 w-4 text-pink-400" />
                <span>Scope: instagram_content_publish</span>
              </div>
              <span className="text-zinc-500 text-[11px]">
                {instagramAccount?.has_refresh_token ? "60-Day Long-Lived Token" : "Meta Graph API"}
              </span>
            </div>

            {!instagramAccount && (
              <div className="space-y-2">
                <Button
                  variant="primary"
                  className="w-full h-9 text-xs font-semibold bg-pink-600 hover:bg-pink-500 text-white"
                  onClick={handleConnectInstagram}
                  isLoading={connectingPlatform === "instagram"}
                >
                  <Zap className="h-4 w-4 mr-1.5" />
                  Authorize Instagram Reels
                </Button>
                <div className="p-2.5 rounded-lg bg-pink-500/5 border border-pink-500/10 text-[11px] text-zinc-400 space-y-1">
                  <span className="text-pink-400 font-medium flex items-center gap-1">
                    <Info className="h-3 w-3" /> Meta Callback URI:
                  </span>
                  <code className="text-pink-300 font-mono text-[10px] bg-black/50 px-1 py-0.5 rounded select-all block">
                    http://localhost:8000/api/social/instagram/callback
                  </code>
                  <p className="text-[10px] text-zinc-400 pt-0.5">
                    Requires an Instagram Professional Account linked to a Facebook Page.
                  </p>
                </div>
              </div>
            )}
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
