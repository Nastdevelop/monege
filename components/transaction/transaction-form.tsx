"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Pencil, ChevronDown } from "lucide-react";
import {
  createTransaction,
  updateTransaction,
} from "@/lib/actions/transaction";
import { AmountInput } from "@/components/amount-input";
import { TagPickerModal } from "./tag-picker-modal";
import { useActionRunner } from "@/components/action-overlay";

export interface WalletOption {
  id: string;
  name: string;
}

export interface TagOption {
  id: string;
  name: string;
  kind: "INCOME" | "EXPENSE";
}

export interface TransactionInitial {
  id: string;
  walletId: string;
  tagId: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  note: string | null;
  date: string;
}

function todayISO(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function TriggerButton({
  label,
  icon,
  className,
  onClick,
}: {
  label?: string;
  icon?: React.ReactNode;
  className?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label || (icon ? "Edit transaksi" : undefined)}
      className={className}
    >
      {icon ?? label}
    </button>
  );
}

export function TransactionFormDialog({
  wallets,
  tags,
  initial,
  defaultWalletId,
  triggerLabel = "+ Transaksi",
  triggerClassName = "",
  triggerIcon,
}: {
  wallets: WalletOption[];
  tags: TagOption[];
  initial?: TransactionInitial;
  defaultWalletId?: string;
  triggerLabel?: string;
  triggerClassName?: string;
  triggerIcon?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"INCOME" | "EXPENSE">(
    initial?.type ?? "EXPENSE"
  );
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [walletId, setWalletId] = useState(
    initial?.walletId ?? defaultWalletId ?? wallets[0]?.id ?? ""
  );
  const [tagId, setTagId] = useState(initial?.tagId ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [date, setDate] = useState(
    initial ? initial.date.slice(0, 10) : todayISO()
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = useActionRunner();

  const selectedTag = tags.find((t) => t.id === tagId);
  const isEditing = Boolean(initial);

  function switchType(next: "INCOME" | "EXPENSE") {
    if (isEditing || next === type) return;
    setType(next);
    setTagId("");
  }

  function reset() {
    setOpen(false);
    setError(null);
    setPickerOpen(false);
    if (!initial) setAmount("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!tagId) {
      setError("Tag wajib dipilih");
      return;
    }
    const payload = {
      walletId,
      tagId,
      type,
      amount: Number(amount),
      note,
      date: new Date(`${date}T12:00:00`).toISOString(),
    };
    const res = await run(() =>
      initial
        ? updateTransaction(initial.id, payload)
        : createTransaction(payload)
    );
    if (!res || !res.ok) {
      setError(res?.error ?? "Gagal menyimpan transaksi");
      return;
    }
    reset();
    router.refresh();
  }

  const inputClass =
    "w-full rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-secondary focus:border-accent";

  return (
    <>
      <TriggerButton
        label={triggerIcon ? undefined : triggerLabel}
        icon={triggerIcon}
        className={
          triggerClassName ||
          "rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        }
        onClick={() => setOpen(true)}
      />

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
          <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-xl border border-line bg-surface p-6 sm:rounded-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">
                {isEditing ? "Edit Transaksi" : "Transaksi Baru"}
              </h2>
              <button
                type="button"
                onClick={reset}
                aria-label="Tutup"
                className="text-secondary hover:text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-1 rounded-lg border border-line p-1">
                {(["INCOME", "EXPENSE"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    disabled={isEditing}
                    onClick={() => switchType(t)}
                    className={`rounded-md py-2 text-sm font-semibold transition-colors ${
                      type === t
                        ? t === "INCOME"
                          ? "bg-income/20 text-income"
                          : "bg-expense/20 text-expense"
                        : "text-secondary hover:text-primary"
                    } ${isEditing ? "cursor-not-allowed opacity-70" : ""}`}
                  >
                    {t === "INCOME" ? "Pemasukan" : "Pengeluaran"}
                  </button>
                ))}
              </div>

              <div className="text-center">
                <AmountInput
                  value={amount}
                  onChange={setAmount}
                  className={`w-full bg-transparent text-center text-3xl font-bold outline-none placeholder:text-secondary ${
                    type === "INCOME" ? "text-income" : "text-expense"
                  }`}
                />
                <p className="mt-1 text-xs text-secondary">Nominal (Rp)</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="tx-wallet" className="text-sm font-medium">
                  Wallet
                </label>
                <select
                  id="tx-wallet"
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  className={inputClass}
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">
                  Tag <span className="text-expense">*</span>
                </span>
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors ${
                    selectedTag
                      ? "border-line bg-background"
                      : "border-dashed border-line text-secondary hover:border-accent hover:text-accent"
                  }`}
                >
                  <span>
                    {selectedTag
                      ? selectedTag.name
                      : `Pilih tag ${type === "INCOME" ? "pemasukan" : "pengeluaran"}...`}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="tx-date" className="text-sm font-medium">
                    Tanggal
                  </label>
                  <input
                    id="tx-date"
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="tx-note" className="text-sm font-medium">
                    Catatan
                  </label>
                  <input
                    id="tx-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Opsional"
                    maxLength={200}
                    className={inputClass}
                  />
                </div>
              </div>

              {error && (
                <p className="rounded-lg bg-expense/10 px-3 py-2 text-sm text-expense">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="mt-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                Simpan
              </button>
            </form>
          </div>
        </div>
      )}

      <TagPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        tags={tags.filter((t) => t.kind === type)}
        kind={type}
        selectedId={tagId}
        onSelect={setTagId}
      />
    </>
  );
}

export function EditTriggerIcon() {
  return <Pencil className="h-4 w-4" />;
}
