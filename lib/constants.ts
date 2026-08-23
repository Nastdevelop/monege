export const LIMITS = {
  userName: { min: 1, max: 60 },
  walletName: { min: 1, max: 50 },
  title: { min: 1, max: 50 },
  personName: { min: 1, max: 60 },
  note: { max: 200 },
  tag: { min: 1, max: 50 },
} as const;

export const MAX_AMOUNT = 999_999_999_999;

export function isValidAmount(value: number): boolean {
  return (
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value > 0 &&
    value <= MAX_AMOUNT
  );
}

export interface ProtectedTag {
  name: string;
  kind: "INCOME" | "EXPENSE";
}

export const PROTECTED_TAGS: ProtectedTag[] = [
  { name: "Transfer Keluar", kind: "EXPENSE" },
  { name: "Transfer Masuk", kind: "INCOME" },
  { name: "Bayar Utang", kind: "EXPENSE" },
  { name: "Terima Utang", kind: "INCOME" },
  { name: "Kasih Pinjaman", kind: "EXPENSE" },
  { name: "Terima Piutang", kind: "INCOME" },
  { name: "Tabungan", kind: "EXPENSE" },
];

export const TRANSFER_OUT_TAG = "Transfer Keluar";
export const TRANSFER_IN_TAG = "Transfer Masuk";
export const DEBT_RECEIVED_TAG = "Terima Utang";
export const LOAN_GIVEN_TAG = "Kasih Pinjaman";
export const SAVING_TAG = "Tabungan";
