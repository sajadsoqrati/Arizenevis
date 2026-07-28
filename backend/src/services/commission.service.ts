export function getCommissionRate(interactionNumber: number): number {
  if (interactionNumber === 1) return 0.1;
  if (interactionNumber === 2) return 0.07;
  return 0.05;
}

export function calculateCommissionAmount(
  originalPrice: number,
  interactionNumber: number
): { rate: number; amount: number } {
  const rate = getCommissionRate(interactionNumber);
  const amount = Math.round(originalPrice * rate);
  return { rate, amount };
}
