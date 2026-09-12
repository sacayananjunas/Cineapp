export function currencyFromMinor(minor: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(minor / 100);
}

export function calculatePricing(subtotalMinor: number) {
  const serviceFeeMinor = Math.round(subtotalMinor * 0.06);
  const taxMinor = Math.round(subtotalMinor * 0.08);
  const totalMinor = subtotalMinor + serviceFeeMinor + taxMinor;
  return { subtotalMinor, serviceFeeMinor, taxMinor, totalMinor };
}

export function makeBookingReference(): string {
  const chunk = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CB-${Date.now().toString(36).toUpperCase()}-${chunk}`;
}

export function makeTicketNumber(): string {
  return `TKT-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}
