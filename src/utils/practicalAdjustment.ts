import type { PracticalScoreBreakdown } from '../types/llm_pk';

/** Net speed/cost adjustment applied on top of the capability score. */
export function getPracticalAdjustment(
  breakdown: PracticalScoreBreakdown,
): number | null {
  if (breakdown.speedDelta === null || breakdown.costDelta === null) return null;
  const adjustment = breakdown.speedDelta + breakdown.costDelta;
  return Number.isFinite(adjustment) ? adjustment : null;
}

export function formatPracticalAdjustment(adjustment: number | null): string {
  if (adjustment === null) return '数据不足';
  if (adjustment > 0) return `+${adjustment.toFixed(1)}`;
  return adjustment.toFixed(1);
}

export function practicalAdjustmentTextClass(
  adjustment: number | null,
  darkBackground: boolean = false,
): string {
  if (adjustment === null) return darkBackground ? 'text-slate-500' : 'text-slate-400';
  if (adjustment > 0) return darkBackground ? 'text-emerald-400' : 'text-emerald-600';
  if (adjustment < 0) return darkBackground ? 'text-rose-400' : 'text-rose-600';
  return darkBackground ? 'text-slate-300' : 'text-slate-500';
}
