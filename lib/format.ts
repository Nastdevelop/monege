export function formatIDR(amount: number | string): string {
  const n = typeof amount === "string" ? Number(amount) : amount;
  return `Rp${Math.round(n).toLocaleString("id-ID")}`;
}

export function formatDateID(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTimeID(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfToday(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

export function daysBetween(from: Date, to: Date): number {
  return Math.max(0, Math.ceil((to.getTime() - from.getTime()) / 86400000));
}
