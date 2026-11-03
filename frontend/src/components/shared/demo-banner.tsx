import { useState, useEffect } from "react";
import { Sparkles, RotateCcw, Loader2 } from "lucide-react";
import { useDemoStatus, useDemoReset } from "@/api/hooks/use-demo";
import { useSettings } from "@/api/hooks/use-settings";
import { useSession } from "@/lib/auth-client";
import { formatResetButtonText } from "@/components/features/auth/demo-utils";

export function DemoBanner() {
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

  return (
    <aside
      aria-label="Informasi Mode Demo"
      className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 sm:px-6 text-amber-900 flex flex-wrap items-center justify-between gap-3 text-xs"
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full uppercase text-[10px] tracking-wider">
          <Sparkles className="w-3 h-3 text-amber-700" />
          Mode Demo
        </span>
        <span className="font-medium text-amber-800">
          Data fiktif simulasi untuk evaluasi juri GTNIC 2026.
        </span>
      </div>

      {isOwner && (
        <button
          type="button"
          disabled={isResetting || cooldown > 0}
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 px-3 py-1 font-semibold text-xs rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xs cursor-pointer"
        >
          {isResetting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RotateCcw className="w-3.5 h-3.5" />
          )}
          <span>{formatResetButtonText(cooldown, isResetting)}</span>
        </button>
      )}
    </aside>
  );
}
