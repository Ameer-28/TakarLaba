import { useState, useEffect } from "react";
import { Sparkles, RotateCcw, Loader2 } from "lucide-react";
import { useDemoStatus, useDemoReset } from "@/api/hooks/use-demo";
import { useSettings } from "@/api/hooks/use-settings";
import { useSession } from "@/lib/auth-client";
import { formatResetButtonText } from "@/components/features/auth/demo-utils";

interface DemoBannerProps {
  isCollapsed?: boolean;
}

export function DemoBanner({ isCollapsed = false }: DemoBannerProps) {
  const { data: session } = useSession();
  const { data: settings } = useSettings();
  const { data: demoStatus } = useDemoStatus();
  const resetMutation = useDemoReset();

  const [cooldown, setCooldown] = useState<number>(0);

  useEffect(() => {
    if (demoStatus?.cooldownSeconds) {
      setCooldown(demoStatus.cooldownSeconds);
    }
  }, [demoStatus?.cooldownSeconds]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const isDemoBusiness = Boolean(
    settings?.isDemo || session?.user?.email?.endsWith("@takarlaba.demo")
  );
  const isOwner = (session?.user as { role?: string })?.role === "OWNER";

  if (!demoStatus?.enabled || !isDemoBusiness) {
    return null;
  }

  const handleReset = async () => {
    if (!isOwner || cooldown > 0 || resetMutation.isPending) return;
    try {
      await resetMutation.mutateAsync();
      setCooldown(60);
    } catch {
      // toast is handled in mutation hook
    }
  };

  const isResetting = resetMutation.isPending;

  if (isCollapsed) {
    return (
      <div className="mb-3 px-2 flex justify-center select-none" aria-label="Demo Mode Information">
        <button
          type="button"
          disabled={!isOwner || isResetting || cooldown > 0}
          onClick={isOwner ? handleReset : undefined}
          title={`Demo Mode: Sample evaluation data for GTNIC 2026${
            isOwner ? ` • Click to ${formatResetButtonText(cooldown, isResetting)}` : ""
          }`}
          className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center relative group hover:bg-amber-100 transition-colors disabled:opacity-75 cursor-pointer shadow-2xs"
        >
          {isResetting ? (
            <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
          ) : (
            <Sparkles className="w-4 h-4 text-amber-700" />
          )}
          <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#06141B] text-white text-xs rounded-lg whitespace-nowrap shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            <span className="font-bold text-amber-400">Demo Mode</span>: Sample data
            {isOwner && (
              <span className="block text-[10px] text-slate-300 mt-0.5">
                {formatResetButtonText(cooldown, isResetting)}
              </span>
            )}
          </div>
        </button>
      </div>
    );
  }

  return (
    <div
      aria-label="Demo Mode Information"
      className="mx-3 mb-3 p-3 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-amber-900 shadow-2xs select-none"
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className="inline-flex items-center gap-1 font-extrabold bg-amber-200/80 text-amber-950 px-2 py-0.5 rounded-full uppercase text-[9px] tracking-wider">
          <Sparkles className="w-3 h-3 text-amber-700" />
          Demo Mode
        </span>
      </div>
      <p className="text-[11px] text-amber-800 leading-snug mb-2.5 font-medium">
        Simulated sample data for GTNIC 2026 evaluation.
      </p>

      {isOwner && (
        <button
          type="button"
          disabled={isResetting || cooldown > 0}
          onClick={handleReset}
          className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 font-bold text-xs rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
        >
          {isResetting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RotateCcw className="w-3.5 h-3.5" />
          )}
          <span>{formatResetButtonText(cooldown, isResetting)}</span>
        </button>
      )}
    </div>
  );
}

export default DemoBanner;
