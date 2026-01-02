/**
 * Stats Module - Transparent & Verifiable Statistics
 */

export * from "./calculate-agency-stats";
export * from "./calculate-creator-stats";

import { calculateAllAgencyStats } from "./calculate-agency-stats";
import { calculateAllCreatorStats } from "./calculate-creator-stats";

/**
 * Calculate all stats (run daily via cron)
 */
export async function calculateAllStats(): Promise<void> {
  console.log("Starting daily stats calculation...");

  await calculateAllAgencyStats();
  await calculateAllCreatorStats();

  console.log("All stats calculation complete!");
}
