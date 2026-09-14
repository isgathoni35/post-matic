"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Share2,
  CheckCircle2,
  Trash2,
  Plus,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SocialAccount, getConnectedSocialAccounts, disconnectSocialAccount } from "@/lib/api";
import { toast } from "sonner";

interface SocialChannelsViewProps {
  userId?: string;
  onOpenSocialModal: () => void;
}

export function SocialChannelsView({ userId, onOpenSocialModal }: SocialChannelsViewProps) {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getConnectedSocialAccounts(userId);
      setAccounts(data);
    } catch (e) {
      console.error("Failed to load accounts:", e);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    let isMounted = true;
    getConnectedSocialAccounts(userId)
      .then((data) => {
        if (isMounted) {
          setAccounts(data);
          setIsLoading(false);
        }
      })
      .catch((e) => {
        console.error("Failed to load accounts:", e);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const handleDisconnect = async (accountId: string) => {
    try {
      await disconnectSocialAccount(accountId, userId);
      toast.success("Account disconnected.");
      loadAccounts();
    } catch {
      toast.error("Failed to disconnect account.");
    }
  };


  const ytAccount = accounts.find((a) => a.platform === "youtube");
  const tiktokAccount = accounts.find((a) => a.platform === "tiktok");
  const instagramAccount = accounts.find((a) => a.platform === "instagram");

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Share2 className="w-5 h-5 text-indigo-400" />
              <span>Social Distribution Channels</span>
            </h1>
            <Badge variant="success" className="text-[10px] font-mono font-semibold">
              Multi-Platform Hub
            </Badge>
          </div>
          <p className="text-xs text-zinc-400">
            Connect and manage autonomous publishing targets across YouTube Shorts, TikTok, and Instagram Reels.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={loadAccounts}
          className="text-xs h-9 bg-white/[0.03] border-white/[0.08]"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
          Sync Status
        </Button>
      </div>

      {/* Grid of Channels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* YouTube Channel Card */}
        <div className="rounded-xl pm-surface border border-white/[0.06] p-5 space-y-5 relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-600/15 border border-red-500/30 flex items-center justify-center text-red-500">
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">YouTube Shorts</h3>
                  <p className="text-xs text-zinc-400">YouTube Data API v3</p>
                </div>
              </div>

              {ytAccount ? (
                <Badge variant="success" className="text-[10px] font-mono">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] font-mono text-zinc-400">
                  Not Connected
                </Badge>
              )}
            </div>

            <div className="space-y-2.5 text-xs bg-[#0c0c0e] rounded-lg p-3.5 border border-white/[0.04]">
              <div className="flex justify-between items-center text-zinc-300">
                <span>Channel Name</span>
                <span className="font-semibold text-white truncate max-w-[140px]">
                  {ytAccount?.account_name || "None connected"}
                </span>
              </div>
              <div className="flex justify-between items-center text-zinc-300">
                <span>Refresh Token</span>
                <span className="font-mono text-[11px] text-emerald-400 font-medium">
                  {ytAccount?.has_refresh_token ? "Offline Access" : "Inactive"}
                </span>
              </div>
              <div className="flex justify-between items-center text-zinc-300">
                <span>Permissions</span>
                <span className="font-mono text-[11px] text-zinc-400">
                  youtube.upload
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            {ytAccount ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleDisconnect(ytAccount.id)}
                className="w-full text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/20 h-9"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Disconnect Channel
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={onOpenSocialModal}
                className="w-full text-xs font-semibold h-9 bg-red-600 hover:bg-red-500 text-white"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Connect YouTube
              </Button>
            )}
          </div>
        </div>

        {/* TikTok Channel Card */}
        <div className="rounded-xl pm-surface border border-white/[0.06] p-5 space-y-5 relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-cyan-600/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-sm">
                  TT
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">TikTok Direct Post</h3>
                  <p className="text-xs text-zinc-400">TikTok Content Posting API</p>
                </div>
              </div>

              {tiktokAccount ? (
                <Badge variant="success" className="text-[10px] font-mono">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] font-mono text-zinc-400">
                  Not Connected
                </Badge>
              )}
            </div>

            <div className="space-y-2.5 text-xs bg-[#0c0c0e] rounded-lg p-3.5 border border-white/[0.04]">
              <div className="flex justify-between items-center text-zinc-300">
                <span>Account Name</span>
                <span className="font-semibold text-white truncate max-w-[140px]">
                  {tiktokAccount?.account_name || "None connected"}
                </span>
              </div>
              <div className="flex justify-between items-center text-zinc-300">
                <span>Refresh Token</span>
                <span className="font-mono text-[11px] text-emerald-400 font-medium">
                  {tiktokAccount?.has_refresh_token ? "Enabled (365d)" : "Inactive"}
                </span>
              </div>
              <div className="flex justify-between items-center text-zinc-300">
                <span>Permissions</span>
                <span className="font-mono text-[11px] text-zinc-400">
                  video.publish, video.upload
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            {tiktokAccount ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleDisconnect(tiktokAccount.id)}
                className="w-full text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/20 h-9"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Disconnect Account
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={onOpenSocialModal}
                className="w-full text-xs font-semibold h-9 bg-cyan-600 hover:bg-cyan-500 text-white"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Connect TikTok
              </Button>
            )}
          </div>
        </div>

        {/* Instagram Reels Channel Card */}
        <div className="rounded-xl pm-surface border border-white/[0.06] p-5 space-y-5 relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-pink-600/15 border border-pink-500/30 flex items-center justify-center text-pink-400 font-bold text-sm">
                  IG
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Instagram Reels</h3>
                  <p className="text-xs text-zinc-400">Meta Graph API</p>
                </div>
              </div>

              {instagramAccount ? (
                <Badge variant="success" className="text-[10px] font-mono">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] font-mono text-zinc-400">
                  Not Connected
                </Badge>
              )}
            </div>

            <div className="space-y-2.5 text-xs bg-[#0c0c0e] rounded-lg p-3.5 border border-white/[0.04]">
              <div className="flex justify-between items-center text-zinc-300">
                <span>Account Name</span>
                <span className="font-semibold text-white truncate max-w-[140px]">
                  {instagramAccount?.account_name || "None connected"}
                </span>
              </div>
              <div className="flex justify-between items-center text-zinc-300">
                <span>Access Token</span>
                <span className="font-mono text-[11px] text-emerald-400 font-medium">
                  {instagramAccount?.has_refresh_token ? "60-Day Long-Lived" : "Inactive"}
                </span>
              </div>
              <div className="flex justify-between items-center text-zinc-300">
                <span>Permissions</span>
                <span className="font-mono text-[11px] text-zinc-400">
                  instagram_content_publish
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            {instagramAccount ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleDisconnect(instagramAccount.id)}
                className="w-full text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/20 h-9"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Disconnect Account
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={onOpenSocialModal}
                className="w-full text-xs font-semibold h-9 bg-pink-600 hover:bg-pink-500 text-white"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Connect Instagram
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
