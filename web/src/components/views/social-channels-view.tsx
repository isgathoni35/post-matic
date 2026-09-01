"use client";

import React, { useEffect, useState } from "react";
import {
  Share2,
  CheckCircle2,
  ExternalLink,
  Trash2,
  Plus,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SocialAccount, getYouTubeAuthUrl, getConnectedSocialAccounts, disconnectSocialAccount } from "@/lib/api";
import { toast } from "sonner";

interface SocialChannelsViewProps {
  userId?: string;
  onOpenSocialModal: () => void;
}

export function SocialChannelsView({ userId, onOpenSocialModal }: SocialChannelsViewProps) {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAccounts = async () => {
    setIsLoading(true);
    try {
      const data = await getConnectedSocialAccounts(userId);
      setAccounts(data);
    } catch (e) {
      console.error("Failed to load accounts:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, [userId]);

  const handleDisconnect = async (accountId: string) => {
    try {
      await disconnectSocialAccount(accountId, userId);
      toast.success("Account disconnected.");
      loadAccounts();
    } catch (e) {
      toast.error("Failed to disconnect account.");
    }
  };

  const ytAccount = accounts.find((a) => a.platform === "youtube");

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Social Distribution Channels
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
              OAuth 2.0 Hub
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Connect and manage autonomous publishing targets for YouTube Shorts and TikTok.
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* YouTube Channel Card */}
        <div className="rounded-2xl bg-[#0f131a] border border-white/[0.08] p-6 space-y-6 shadow-xl relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-red-600/15 border border-red-500/30 flex items-center justify-center text-red-500 shadow-lg shadow-red-500/10">
                <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">YouTube Shorts</h3>
                <p className="text-xs text-zinc-400">Direct publishing via YouTube Data API v3</p>
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

          <div className="space-y-3 text-xs bg-black/40 rounded-xl p-4 border border-white/[0.04]">
            <div className="flex justify-between items-center text-zinc-300">
              <span>Channel Name</span>
              <span className="font-semibold text-white">
                {ytAccount?.account_name || "None connected"}
              </span>
            </div>
            <div className="flex justify-between items-center text-zinc-300">
              <span>Auto-Refresh Token</span>
              <span className="font-mono text-[11px] text-emerald-400 font-medium">
                {ytAccount?.has_refresh_token ? "Enabled (Offline Access)" : "Inactive"}
              </span>
            </div>
            <div className="flex justify-between items-center text-zinc-300">
              <span>Upload Permissions</span>
              <span className="font-mono text-[11px] text-zinc-400">
                youtube.upload
              </span>
            </div>
          </div>

          <div className="pt-2">
            {ytAccount ? (
              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDisconnect(ytAccount.id)}
                  className="w-full text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/20 h-9"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Disconnect Channel
                </Button>
              </div>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={onOpenSocialModal}
                className="w-full text-xs font-semibold h-10 shadow-lg shadow-amber-500/20"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Connect YouTube Channel
              </Button>
            )}
          </div>
        </div>

        {/* TikTok Channel Card */}
        <div className="rounded-2xl bg-[#0f131a] border border-white/[0.08] p-6 space-y-6 shadow-xl relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-cyan-600/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
                <Share2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">TikTok Creator Direct</h3>
                <p className="text-xs text-zinc-400">Direct video posting to TikTok feed</p>
              </div>
            </div>

            <Badge variant="outline" className="text-[10px] font-mono text-zinc-400">
              Coming Soon
            </Badge>
          </div>

          <div className="space-y-3 text-xs bg-black/40 rounded-xl p-4 border border-white/[0.04]">
            <div className="flex justify-between items-center text-zinc-300">
              <span>Platform Protocol</span>
              <span className="font-mono text-zinc-400">TikTok Content Posting API</span>
            </div>
            <div className="flex justify-between items-center text-zinc-300">
              <span>Aspect Ratio</span>
              <span className="font-mono text-zinc-400">9:16 Vertical HD</span>
            </div>
            <div className="flex justify-between items-center text-zinc-300">
              <span>Auto Hashtags</span>
              <span className="font-mono text-zinc-400">Integrated</span>
            </div>
          </div>

          <div className="pt-2">
            <Button
              variant="secondary"
              size="sm"
              disabled
              className="w-full text-xs h-10 bg-white/[0.02] border-white/[0.06] text-zinc-500"
            >
              TikTok Direct Beta (Coming Soon)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
