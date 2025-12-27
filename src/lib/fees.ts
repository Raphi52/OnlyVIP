// Platform fee configuration
export const PLATFORM_FEE_RATE = 0.03; // 3%

/**
 * Calculate platform fee and net amount for a payment
 * @param amount - The gross payment amount
 * @returns Object with platformFee and netAmount
 */
export function calculateFees(amount: number): {
  platformFee: number;
  netAmount: number;
} {
  const platformFee = Math.round(amount * PLATFORM_FEE_RATE * 100) / 100;
  const netAmount = Math.round((amount - platformFee) * 100) / 100;

  return {
    platformFee,
    netAmount,
  };
}
