/**
 * Pure extraction helpers for demo mode status, cooldown calculation, and display text.
 */

export function isDemoActive(status?: { enabled: boolean } | null): boolean {
  return Boolean(status && status.enabled);
}

export function computeCooldownRemaining(
  resetAt: string | Date | null | undefined,
  now: Date = new Date(),
  cooldownWindowSeconds = 60
): number {
  if (!resetAt) return 0;
  const resetTime = typeof resetAt === "string" ? new Date(resetAt).getTime() : resetAt.getTime();
  if (isNaN(resetTime)) return 0;

  const elapsedSeconds = Math.floor((now.getTime() - resetTime) / 1000);
  return Math.max(0, cooldownWindowSeconds - elapsedSeconds);
}

export function formatCooldownBadge(seconds: number): string {
  if (seconds <= 0) return "Available";
  return `Wait (${seconds}s)`;
}

export function formatResetButtonText(seconds: number, isResetting: boolean): string {
  if (isResetting) return "Resetting data...";
  if (seconds > 0) return `Load Sample Data (${seconds}s)`;
  return "Load Sample Data";
}
