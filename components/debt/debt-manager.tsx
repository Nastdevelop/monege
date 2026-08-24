"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import { createDebt, payDebt, deleteDebt } from "@/lib/actions/debt";
import { formatIDR, formatDateID, daysBetween } from "@/lib/format";
import { AmountInput } from "@/components/amount-input";
import { useActionRunner } from "@/components/action-overlay";

export interface DebtItem {
  id: string;
  personName: string;
  direction: "I_OWE" | "OWED_TO_ME";
  amount: number;
  paidAmount: number;
  status: "UNPAID" | "PARTIAL" | "PAID";
  dueDate: string | null;
  walletId: string;
  hasInitialTx: boolean;
  payments: { id: string; amount: number; paidAt: string }[];
}

const statusLabel = {
  UNPAID: { text: "Belum lunas", cls: "text-warning" },
  PARTIAL: { text: "Lunas sebagian", cls: "text-warning" },
  PAID: { text: "Lunas", cls: "text-income" },
};

export function DebtManager({
  debts,
  wallets,
}: {
  debts: DebtItem[];
  wallets: { id: string; name: string; balance: number }[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"I_OWE" | "OWED_TO_ME">("I_OWE");
  const [addOpen, setAddOpen] = useState(false);
  const [payTarget, setPayTarget] = useState<DebtItem | null>(null);
  const [paidOffTarget, setPaidOffTarget] = useState<DebtItem | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [person, setPerson] = useState("");
  const [amount, setAmount] = useState("");
  const [walletId, setWalletId] = useState(wallets[0]?.id ?? "");
  const [dueDate, setDueDate] = useState("");
  const [isNew, setIsNew] = useState(true);
  const [payAmount, setPayAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const run = useActionRunner();

  function closeAll() {
    setAddOpen(false);
    setPayTarget(null);
    setError(null);
    setPerson("");
    setAmount("");
    setDueDate("");
    setPayAmount("");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await run(() =>
        createDebt(
          person,
          tab,
          walletId,
          Number(amount),
          dueDate || undefined,
          isNew
        )
      );
      if (!res || !res.ok)
        return setError(res?.error ?? "Gagal mencatat utang/piutang");
      closeAll();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!payTarget) return;
    setError(null);
    setBusy(true);
    try {
      const res = await run(() => payDebt(payTarget.id, Number(payAmount)));
      if (!res || !res.ok)
        return setError(res?.error ?? "Gagal menyimpan pembayaran");
      const paidOff = res.paidOff === true;
      closeAll();
      router.refresh();
      if (paidOff) setPaidOffTarget(payTarget);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(d: DebtItem) {
    setBusy(true);
    try {
      const res = await run(() => deleteDebt(d.id));
      if (!res || !res.ok) {
        window.alert(res?.error ?? "Gagal menghapus data utang/piutang");
        return;
      }
      setPaidOffTarget(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-secondary focus:border-accent";

  const filtered = debts.filter((d) => d.direction === tab);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid grid-cols-2 gap-1 rounded-lg border border-line p-1">
          {(
            [
              ["I_OWE", "Utang Saya"],
              ["OWED_TO_ME", "Piutang Saya"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                tab === key
                  ? "bg-accent/20 text-accent"
                  : "text-secondary hover:text-primary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            closeAll();
            setAddOpen(true);
          }}
          disabled={wallets.length === 0}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Catat
        </button>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {filtered.length === 0 && (
          <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-line text-sm text-secondary">
            {tab === "I_OWE"
              ? "Tidak ada utang tercatat."
              : "Tidak ada piutang tercatat."}
          </div>
        )}
        {filtered.map((d) => {
          const pct = Math.min(100, (d.paidAmount / d.amount) * 100);
          const remaining = d.amount - d.paidAmount;
          const daysLeft = d.dueDate
            ? daysBetween(new Date(), new Date(d.dueDate))
            : null;
          return (
            <div
              key={d.id}
              className="rounded-xl border border-line bg-surface p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold">{d.personName}</p>
                  <p className="text-xs text-secondary">
                    Jatuh tempo: {d.dueDate ? formatDateID(d.dueDate) : "—"}
                    {daysLeft !== null &&
                      d.status !== "PAID" &&
                      ` (${daysLeft} hari lagi)`}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold ${statusLabel[d.status].cls}`}
                >
                  {statusLabel[d.status].text}
                </span>
              </div>

              <div className="mt-3 flex items-end justify-between gap-3">
                <div className="flex-1">
                  <div className="h-2 overflow-hidden rounded-full bg-muted-tag">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-secondary">
                    {formatIDR(d.paidAmount)} / {formatIDR(d.amount)}
                  </p>
                </div>
                <p className="tabular-nums whitespace-nowrap text-sm font-bold">
                  sisa {formatIDR(remaining)}
                </p>
              </div>

              <div className="mt-3 flex gap-2">
                {d.status !== "PAID" && (
                  <button
                    type="button"
                    onClick={() => {
                      setPayTarget(d);
                      setPayAmount(String(Math.round(remaining)));
                      setError(null);
                    }}
                    className="rounded-lg bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent/25"
                  >
                    {d.direction === "I_OWE" ? "Bayar" : "Terima"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    setExpanded(expanded === d.id ? null : d.id)
                  }
                  disabled={d.payments.length === 0}
                  className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-secondary transition-colors hover:text-accent disabled:opacity-40"
                >
                  Histori ({d.payments.length})
                  {expanded === d.id ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(d)}
                  title={
                    d.hasInitialTx
                      ? "Transaksi awal hutang baru akan ikut dibalik"
                      : undefined
                  }
                  className="ml-auto rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-secondary transition-colors hover:text-expense"
                >
                  Hapus
                </button>
              </div>

              {expanded === d.id && d.payments.length > 0 && (
                <ul className="mt-3 flex flex-col gap-1 border-t border-line pt-3">
                  {d.payments.map((p) => (
                    <li
                      key={p.id}
                      className="flex justify-between text-xs text-secondary"
                    >
                      <span>{formatDateID(p.paidAt)}</span>
                      <span className="tabular-nums font-semibold text-primary">
                        {formatIDR(p.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {(addOpen || payTarget) && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
          <div className="w-full max-w-sm rounded-t-xl border border-line bg-surface p-6 sm:rounded-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">
                {addOpen
                  ? tab === "I_OWE"
                    ? "Catat Utang"
                    : "Catat Piutang"
                  : `${tab === "I_OWE" ? "Bayar utang ke" : "Terima pelunasan dari"} ${payTarget?.personName}`}
              </h2>
              <button
                type="button"
                onClick={closeAll}
                aria-label="Tutup"
                className="text-secondary hover:text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {addOpen ? (
              <form onSubmit={handleCreate} className="flex flex-col gap-3">
                <input
                  autoFocus
                  required
                  value={person}
                  onChange={(e) => setPerson(e.target.value)}
                  placeholder={`Nama orang${tab === "I_OWE" ? " yang kamu hutangi" : " yang berutang ke kamu"}`}
                  maxLength={60}
                  className={inputClass}
                />
                <AmountInput
                  value={amount}
                  onChange={setAmount}
                  placeholder="Nominal"
                  className={inputClass}
                />
                <select
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  aria-label="Wallet"
                  className={inputClass}
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatIDR(w.balance)})
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-2 gap-1 rounded-lg border border-line p-1">
                  <button
                    type="button"
                    onClick={() => setIsNew(true)}
                    className={`rounded-md py-2 text-xs font-semibold transition-colors ${
                      isNew ? "bg-accent/20 text-accent" : "text-secondary"
                    }`}
                  >
                    Hutang Baru
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsNew(false)}
                    className={`rounded-md py-2 text-xs font-semibold transition-colors ${
                      !isNew ? "bg-accent/20 text-accent" : "text-secondary"
                    }`}
                  >
                    Hutang Lama
                  </button>
                </div>
                <p className="text-xs leading-relaxed text-secondary">
                  {isNew
                    ? tab === "I_OWE"
                      ? "Uang pinjaman otomatis masuk ke wallet sebagai pemasukan."
                      : "Uang pinjaman otomatis keluar dari wallet sebagai pengeluaran."
                    : "Hanya catatan — saldo tidak berubah sampai ada pembayaran."}
                </p>

                <label className="text-xs text-secondary">
                  Tanggal jatuh tempo (opsional)
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={`${inputClass} mt-1`}
                  />
                </label>
                {error && (
                  <p className="rounded-lg bg-expense/10 px-3 py-2 text-sm text-expense">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background disabled:opacity-60"
                >
                  Simpan
                </button>
              </form>
            ) : (
              payTarget && (
                <form onSubmit={handlePay} className="flex flex-col gap-3">
                  <p className="text-sm text-secondary">
                    Sisa:{" "}
                    <span className="font-semibold text-primary">
                      {formatIDR(payTarget.amount - payTarget.paidAmount)}
                    </span>
                  </p>
                  <AmountInput
                    value={payAmount}
                    onChange={setPayAmount}
                    placeholder="Nominal bayar"
                    className={inputClass}
                  />
                  {error && (
                    <p className="rounded-lg bg-expense/10 px-3 py-2 text-sm text-expense">
                      {error}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background disabled:opacity-60"
                  >
                    Konfirmasi
                  </button>
                </form>
              )
            )}
          </div>
        </div>
      )}

      {paidOffTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-6 text-center">
            <p className="text-2xl">🎉</p>
            <h3 className="mt-2 text-base font-semibold">
              Selamat! Utang piutang sudah lunas
            </h3>
            <p className="mt-1 text-sm text-secondary">
              Hapus &ldquo;{paidOffTarget.personName}&rdquo; dari daftar?
              {paidOffTarget.hasInitialTx &&
                " Transaksi awalnya juga akan dibalik."}
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setPaidOffTarget(null)}
                className="flex-1 rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-secondary transition-colors hover:text-primary"
              >
                Biarkan
              </button>
              <button
                type="button"
                onClick={() => handleDelete(paidOffTarget)}
                disabled={busy}
                className="flex-1 rounded-lg bg-expense px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
