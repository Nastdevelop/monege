"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { createSavingGoal, contribute, deleteSavingGoal } from "@/lib/actions/saving";
import { calcSchedule } from "@/lib/saving-calc";
import { formatIDR, formatDateID } from "@/lib/format";
import { AmountInput } from "@/components/amount-input";
import { useActionRunner } from "@/components/action-overlay";

export interface SavingGoalItem {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  walletId: string;
  contributions: { id: string; amount: number; contributedAt: string }[];
}

function RadialProgress({ pct }: { pct: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <div className="relative h-16 w-16">
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke="var(--muted-tag-bg)"
          strokeWidth="6"
        />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (clamped / 100) * c}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
        {Math.round(clamped)}%
      </span>
    </div>
  );
}

export function SavingsManager({
  goals,
  wallets,
}: {
  goals: SavingGoalItem[];
  wallets: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [contributeTarget, setContributeTarget] =
    useState<SavingGoalItem | null>(null);

  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [walletId, setWalletId] = useState(wallets[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const run = useActionRunner();

  function closeAll() {
    setAddOpen(false);
    setContributeTarget(null);
    setError(null);
    setTitle("");
    setTargetAmount("");
    setTargetDate("");
    setAmount("");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await run(() =>
      createSavingGoal(title, Number(targetAmount), targetDate, walletId)
    );
    if (!res || !res.ok) return setError(res?.error ?? "Gagal");
    closeAll();
    router.refresh();
  }

  async function handleContribute(e: React.FormEvent) {
    e.preventDefault();
    if (!contributeTarget) return;
    setError(null);
    const res = await run(() => contribute(contributeTarget.id, Number(amount)));
    if (!res || !res.ok) return setError(res?.error ?? "Gagal");
    closeAll();
    router.refresh();
  }

  async function handleDelete(g: SavingGoalItem) {
    const first = await run(() => deleteSavingGoal(g.id, false));
    if (!first || (first.ok !== true && first.error !== "CONFIRM_NEEDED")) {
      window.alert(first?.error ?? "Gagal menghapus");
      return;
    }
    if (!first.ok) {
      const sure = window.confirm(
        `Hapus "${g.title}" beserta ${g.contributions.length} kontribusi? Saldo wallet tidak dikembalikan.`
      );
      if (!sure) return;
      const res = await run(() => deleteSavingGoal(g.id, true));
      if (!res || !res.ok) {
        window.alert(res?.error ?? "Gagal menghapus");
        return;
      }
    }
    router.refresh();
  }

  const inputClass =
    "w-full rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-secondary focus:border-accent";

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          closeAll();
          setAddOpen(true);
        }}
        disabled={wallets.length === 0}
        className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        <Plus className="h-4 w-4" /> Target Baru
      </button>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {goals.length === 0 && (
          <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-line text-sm text-secondary sm:col-span-2">
            Belum ada target tabungan.
          </div>
        )}
        {goals.map((g) => {
          const sched = calcSchedule(
            g.targetAmount,
            g.currentAmount,
            g.targetDate
          );
          const pct = (g.currentAmount / g.targetAmount) * 100;
          return (
            <div key={g.id} className="rounded-xl border border-line bg-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{g.title}</p>
                  <p className="text-xs text-secondary">
                    Target {formatDateID(g.targetDate)}
                  </p>
                </div>
                <RadialProgress pct={pct} />
              </div>

              <p className="tabular-nums mt-3 text-sm font-bold text-accent">
                {formatIDR(g.currentAmount)}{" "}
                <span className="text-secondary">
                  / {formatIDR(g.targetAmount)}
                </span>
              </p>

              {!sched.onTrack ? (
                <p className="mt-2 text-xs leading-relaxed text-secondary">
                  Sisihkan{" "}
                  <span className="font-semibold text-primary tabular-nums">
                    {formatIDR(Math.ceil(sched.perDay))}/hari
                  </span>{" "}
                  · {formatIDR(Math.ceil(sched.perWeek))}/minggu ·{" "}
                  {formatIDR(Math.ceil(sched.perMonth))}/bulan untuk capai
                  target ({sched.daysLeft} hari tersisa)
                </p>
              ) : (
                <p className="mt-2 text-xs font-semibold text-income">
                  Target tercapai!
                </p>
              )}

              <div className="mt-3 flex gap-2">
                {!sched.onTrack && (
                  <button
                    type="button"
                    onClick={() => {
                      setContributeTarget(g);
                      setAmount(String(Math.ceil(sched.perDay)));
                      setError(null);
                    }}
                    className="rounded-lg bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent/25"
                  >
                    + Kontribusi
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(g)}
                  className="ml-auto rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-secondary transition-colors hover:text-expense"
                >
                  Hapus
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {(addOpen || contributeTarget) && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
          <div className="w-full max-w-sm rounded-t-xl border border-line bg-surface p-6 sm:rounded-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">
                {addOpen ? "Target Tabungan Baru" : "Tambah Kontribusi"}
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
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Judul (mis. Beli Laptop)"
                  maxLength={100}
                  className={inputClass}
                />
                <AmountInput
                  value={targetAmount}
                  onChange={setTargetAmount}
                  placeholder="Nominal target"
                  className={inputClass}
                />
                <label className="text-xs text-secondary">
                  Tanggal target
                  <input
                    type="date"
                    required
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className={`${inputClass} mt-1`}
                  />
                </label>
                <select
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  aria-label="Wallet sumber"
                  className={inputClass}
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      Wallet sumber: {w.name}
                    </option>
                  ))}
                </select>
                {error && (
                  <p className="rounded-lg bg-expense/10 px-3 py-2 text-sm text-expense">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                 
                  className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background disabled:opacity-60"
                >
                  Simpan
                </button>
              </form>
            ) : (
              contributeTarget && (
                <form onSubmit={handleContribute} className="flex flex-col gap-3">
                  <p className="text-sm text-secondary">
                    Menambah kontribusi mengurangi saldo wallet sumber dan
                    tercatat sebagai pengeluaran bertag &ldquo;Tabungan&rdquo;.
                  </p>
                  <AmountInput
                    value={amount}
                    onChange={setAmount}
                    placeholder="Nominal"
                    className={inputClass}
                  />
                  {error && (
                    <p className="rounded-lg bg-expense/10 px-3 py-2 text-sm text-expense">
                      {error}
                    </p>
                  )}
                  <button
                    type="submit"
                   
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
    </div>
  );
}

