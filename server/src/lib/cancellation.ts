export type CancellationPolicy = {
  penaltyPercentage: number;
  penaltyAmountCents: number;
  refundAmountCents: number;
  hoursRemaining: number;
  isFree: boolean;
};

export function calculateCancellation(
  eventStartsAt: Date,
  paidAmountCents: number,
  paymentStatus: string,
  now = new Date(),
): CancellationPolicy {
  const paid = Math.max(0, Math.round(paidAmountCents));
  const hoursRemaining = (eventStartsAt.getTime() - now.getTime()) / 3_600_000;
  const isFree = paid === 0;
  const successfulPayment = paymentStatus === "succeeded";

  if (isFree || !successfulPayment) {
    return {
      penaltyPercentage: 0,
      penaltyAmountCents: 0,
      refundAmountCents: 0,
      hoursRemaining,
      isFree,
    };
  }

  const penaltyPercentage =
    hoursRemaining <= 0
      ? 100
      : hoursRemaining >= 168
        ? 0
        : hoursRemaining >= 72
          ? 10
          : hoursRemaining >= 24
            ? 30
            : 50;
  const penaltyAmountCents = Math.round((paid * penaltyPercentage) / 100);
  return {
    penaltyPercentage,
    penaltyAmountCents,
    refundAmountCents: paid - penaltyAmountCents,
    hoursRemaining,
    isFree,
  };
}

export function cancellationRefundStatus(
  paidAmountCents: number,
  paymentStatus: string,
  refundAmountCents: number,
): string {
  if (
    paidAmountCents === 0 ||
    paymentStatus !== "succeeded" ||
    refundAmountCents === 0
  ) {
    return "not_required";
  }
  return "pending";
}
