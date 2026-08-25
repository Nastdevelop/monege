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

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 86_400_000;

export function startOfToday(): Date {
  return new Date(
    Math.floor((Date.now() + WIB_OFFSET_MS) / DAY_MS) * DAY_MS - WIB_OFFSET_MS
  );
}

export function endOfToday(): Date {
  return new Date(startOfToday().getTime() + DAY_MS - 1);
}

export function parseDateWIB(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) - WIB_OFFSET_MS);
}

export function endOfDateWIB(iso: string): Date {
  return new Date(parseDateWIB(iso).getTime() + DAY_MS - 1);
}

export function dateKeyWIB(d: Date): string {
  return new Date(d.getTime() + WIB_OFFSET_MS).toISOString().slice(0, 10);
}

export function daysBetween(from: Date, to: Date): number {
  return Math.max(0, Math.ceil((to.getTime() - from.getTime()) / 86400000));
}
