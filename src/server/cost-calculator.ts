import type { RestorePhaseMetrics } from "@/shared/types";

/**
 * Vercel Sandbox pricing model (as of April 2026)
 * $0.00005 per vCPU-second
 */
const COST_PER_VCPU_SECOND = 0.00005;

export interface CostEstimate {
  totalMs: number;
  vcpus: number;
  costUsd: number;
  costUsdFormatted: string;
  pricePerSecond: number;
  description: string;
}

export interface CostSummary {
  lastRestore: CostEstimate | null;
  last7Restores: {
    count: number;
    totalMs: number;
    averageMs: number;
    minMs: number;
    maxMs: number;
    totalCostUsd: number;
    totalCostUsdFormatted: string;
    averageCostPerRestore: number;
    averageCostPerRestoreFormatted: string;
  };
  projectedMonthly: {
    batchesPerWeek: number;
    restoredPerWeek: number;
    costPerWeekUsd: number;
    costPerWeekUsdFormatted: string;
    costPerMonthUsd: number;
    costPerMonthUsdFormatted: string;
  };
}

/**
 * Calculate cost of a single restore operation.
 */
export function calculateRestoreCost(metrics: RestorePhaseMetrics): CostEstimate {
  const durationSeconds = metrics.totalMs / 1000;
  const costUsd = metrics.vcpus * durationSeconds * COST_PER_VCPU_SECOND;

  return {
    totalMs: metrics.totalMs,
    vcpus: metrics.vcpus,
    costUsd,
    costUsdFormatted: costUsd < 0.01 ? `$${costUsd.toFixed(5)}` : `$${costUsd.toFixed(2)}`,
    pricePerSecond: metrics.vcpus * COST_PER_VCPU_SECOND,
    description: `${metrics.vcpus} vCPU(s) for ${durationSeconds.toFixed(2)}s = ${costUsd.toFixed(5)} USD`,
  };
}

/**
 * Summarize costs across recent restores.
 * Useful for showing user: last restore cost, weekly trend, monthly projection.
 */
export function summarizeRestoreCosts(
  lastRestore: RestorePhaseMetrics | null,
  restoreHistory: RestorePhaseMetrics[],
  batchesPerWeek: number = 3, // user sends 3 batches/week by default
): CostSummary {
  // Last restore
  const lastRestoreCost = lastRestore ? calculateRestoreCost(lastRestore) : null;

  // Last 7 restores (or whatever we have)
  const recent7 = restoreHistory.slice(0, 7);
  const last7Metrics = {
    count: recent7.length,
    totalMs: recent7.reduce((sum, m) => sum + m.totalMs, 0),
    averageMs: recent7.length > 0 ? recent7.reduce((sum, m) => sum + m.totalMs, 0) / recent7.length : 0,
    minMs: recent7.length > 0 ? Math.min(...recent7.map((m) => m.totalMs)) : 0,
    maxMs: recent7.length > 0 ? Math.max(...recent7.map((m) => m.totalMs)) : 0,
  };

  const last7TotalCostUsd = recent7.reduce((sum, m) => sum + calculateRestoreCost(m).costUsd, 0);
  const last7AvgCostPerRestore = recent7.length > 0 ? last7TotalCostUsd / recent7.length : 0;

  // Project to monthly based on batch frequency
  // Assumption: each batch generate = ~1 restore (or fewer if batches are created offline)
  // Each send = ~0 cost (happens outside sandbox)
  // Each feedback collecting = ~1 restore
  // So roughly: batchesPerWeek * 2 (create + feedback) restores per week
  const restoresPerWeek = batchesPerWeek * 1.5; // conservative: batch create + 50% feedback cycles
  const costPerWeekUsd = last7AvgCostPerRestore * restoresPerWeek;
  const costPerMonthUsd = costPerWeekUsd * 4.33; // average weeks per month

  return {
    lastRestore: lastRestoreCost,
    last7Restores: {
      count: last7Metrics.count,
      totalMs: last7Metrics.totalMs,
      averageMs: last7Metrics.averageMs,
      minMs: last7Metrics.minMs,
      maxMs: last7Metrics.maxMs,
      totalCostUsd: last7TotalCostUsd,
      totalCostUsdFormatted: `$${last7TotalCostUsd.toFixed(4)}`,
      averageCostPerRestore: last7AvgCostPerRestore,
      averageCostPerRestoreFormatted: last7AvgCostPerRestore < 0.01 ? `$${last7AvgCostPerRestore.toFixed(5)}` : `$${last7AvgCostPerRestore.toFixed(2)}`,
    },
    projectedMonthly: {
      batchesPerWeek,
      restoredPerWeek: restoresPerWeek,
      costPerWeekUsd,
      costPerWeekUsdFormatted: `$${costPerWeekUsd.toFixed(2)}`,
      costPerMonthUsd,
      costPerMonthUsdFormatted: `$${costPerMonthUsd.toFixed(2)}`,
    },
  };
}

/**
 * User-friendly summary string for display in admin panel.
 */
export function formatCostSummary(summary: CostSummary): string {
  const lines: string[] = [];

  if (summary.lastRestore) {
    lines.push(`Last Restore: ${summary.lastRestore.costUsdFormatted} (${summary.lastRestore.totalMs}ms)`);
  }

  if (summary.last7Restores.count > 0) {
    lines.push(
      `Last ${summary.last7Restores.count} Restores: ${summary.last7Restores.totalCostUsdFormatted} avg ${summary.last7Restores.averageCostPerRestoreFormatted} each`,
    );
  }

  lines.push(
    `Projected: ${summary.projectedMonthly.costPerMonthUsdFormatted}/month (${summary.projectedMonthly.batchesPerWeek} batches/week)`,
  );

  return lines.join(" | ");
}
