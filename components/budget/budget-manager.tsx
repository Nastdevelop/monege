"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Power } from "lucide-react";
import {
  createBudget,
  updateBudget,
  deleteBudget,
  type BudgetKind,
} from "@/lib/actions/budget";
import { formatIDR } from "@/lib/format";
import { AmountInput } from "@/components/amount-input";
import { useActionRunner } from "@/components/action-overlay";

export interface BudgetRuleItem {
  id: string;
  kind: BudgetKind;
  tagName: string | null;
  targetAmount: number;
  isActive: boolean;
}

export interface BudgetStatusItem {
  id: string;
  kind: BudgetKind;
  tagName: string | null;
  targetAmount: number;
  actual: number;
  status: "REACHED" | "UNDER" | "OVER" | "OK";
}

const statusMeta = {
  REACHED: { label: "Tercapai", cls: "text-income" },
  OK: { label: "On Track", cls: "text-income" },
  UNDER: { label: "Under", cls: "text-warning" },
  OVER: { label: "Over", cls: "text-expense" },
};

function ruleLabel(rule: { kind: BudgetKind; tagName: string | null }) {
  if (rule.kind === "income") return "Pemasukan minimal /hari";
  if (rule.kind === "saving") return "Nabung minimal /hari";
  return `Maks pengeluaran tag "${rule.tagName}" /hari`;
}

export function BudgetManager({
  rules,
  statuses,
  tags,
}: {
  rules: BudgetRuleItem[];
  statuses: BudgetStatusItem[];
  tags: string[];
}) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<BudgetRuleItem | null>(null);
  const [kind, setKind] = useState<BudgetKind>("expense");
  const [tagName, setTagName] = useState(tags[0] ?? "");
  const [targetAmount, setTargetAmount] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const run = useActionRunner();

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await run(() =>
      createBudget(
        kind,
        kind === "expense" ? tagName : null,
        Number(targetAmount)
      )
    );
    if (!res || !res.ok)
      return setError(res?.error ?? "Gagal membuat aturan budget");
    setAddOpen(false);
    setTargetAmount("");
    router.refresh();
  }

  function openEdit(r: BudgetRuleItem) {
    setEditTarget(r);
    setEditAmount(String(r.targetAmount));
    setEditError(null);
  }

  function closeEdit() {
    setEditTarget(null);
    setEditError(null);
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setEditError(null);
    const val = Number(editAmount.trim());
    if (!Number.isInteger(val) || val <= 0) {
      setEditError("Nominal harus bilangan bulat lebih dari 0");
      return;
    }
    const res = await run(() =>
      updateBudget(editTarget.id, val, editTarget.isActive)
    );
    if (!res || !res.ok) {
      setEditError(res?.error ?? "Gagal memperbarui target nominal");
      return;
    }
    closeEdit();
    router.refresh();
  }

  async function handleToggle(id: string, isActive: boolean, targetAmount: number) {
    setActionError(null);
    const res = await run(() => updateBudget(id, targetAmount, !isActive));
    if (!res || !res.ok)
      setActionError(res?.error ?? "Gagal mengubah status aturan budget");
    else router.refresh();
  }

  async function handleDelete(id: string) {
    setActionError(null);
    if (!window.confirm("Hapus aturan budget ini?")) return;
    const res = await run(() => deleteBudget(id));
    if (!res || !res.ok)
      setActionError(res?.error ?? "Gagal menghapus aturan budget");
    else router.refresh();
  }

  const inputClass =
    "w-full rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-secondary focus:border-accent";

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          setAddOpen(true);
          setError(null);
        }}
        className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
      >
        <Plus className="h-4 w-4" /> Aturan
      </button>

      {actionError && (
        <p
          role="alert"
          className="mt-3 rounded-lg bg-expense/10 px-3 py-2 text-sm text-expense"
        >
          {actionError}
        </p>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-line bg-surface p-5">
          <h3 className="text-sm font-semibold">Aturan Aktif</h3>
          <ul className="mt-3 flex flex-col gap-2">
            {rules.length === 0 && (
              <p className="text-sm text-secondary">Belum ada aturan.</p>
            )}
            {rules.map((r) => (
              <li
                key={r.id}
                className={`flex items-center justify-between gap-2 rounded-lg bg-background px-3 py-2.5 ${
                  r.isActive ? "" : "opacity-50"
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm">{ruleLabel(r)}</p>
                  <button
                    type="button"
                    onClick={() => openEdit(r)}
                    className="tabular-nums text-xs font-semibold text-accent underline-offset-2 hover:underline"
                  >
                    {formatIDR(r.targetAmount)}
                  </button>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      handleToggle(r.id, r.isActive, r.targetAmount)
                    }
                    aria-label={r.isActive ? "Nonaktifkan" : "Aktifkan"}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line transition-colors ${
                      r.isActive ? "text-income" : "text-secondary"
                    }`}
                  >
                    <Power className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(r.id)}
                    aria-label="Hapus aturan"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line text-secondary transition-colors hover:text-expense"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-line bg-surface p-5">
          <h3 className="text-sm font-semibold">Realisasi Hari Ini</h3>
          <ul className="mt-3 flex flex-col gap-3">
            {statuses.length === 0 && (
              <p className="text-sm text-secondary">
                Belum ada data — buat aturan dulu.
              </p>
            )}
            {statuses.map((s) => {
              const meta = statusMeta[s.status];
              const pct = Math.min(
                100,
                Math.round((s.actual / s.targetAmount) * 100)
              );
              return (
                <li key={s.id}>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate">{ruleLabel(s)}</span>
                    <span className={`whitespace-nowrap text-xs font-semibold ${meta.cls}`}>
                      {meta.label}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted-tag">
                    <div
                      className={`h-full rounded-full ${
                        s.status === "OVER"
                          ? "bg-expense"
                          : s.status === "UNDER"
                            ? "bg-warning"
                            : "bg-income"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="tabular-nums mt-1 text-xs text-secondary">
                    {formatIDR(s.actual)} / {formatIDR(s.targetAmount)}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
          <div className="w-full max-w-sm rounded-t-xl border border-line bg-surface p-6 sm:rounded-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">Aturan Budget Baru</h2>
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                aria-label="Tutup"
                className="text-secondary hover:text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="flex flex-col gap-3">
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as BudgetKind)}
                aria-label="Jenis aturan"
                className={inputClass}
              >
                <option value="income">Pemasukan minimal harian</option>
                <option value="expense">Maksimal pengeluaran per tag</option>
                <option value="saving">Target nabung harian</option>
              </select>

              {kind === "expense" && (
                <select
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  aria-label="Tag"
                  className={inputClass}
                >
                  {tags.length === 0 && <option value="">Buat tag dulu</option>}
                  {tags.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              )}

              <AmountInput
                value={targetAmount}
                onChange={setTargetAmount}
                placeholder="Nominal target per hari"
                className={inputClass}
              />

              {error && (
                <p className="rounded-lg bg-expense/10 px-3 py-2 text-sm text-expense">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={kind === "expense" && tags.length === 0}
                className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background disabled:opacity-60"
              >
                Simpan
              </button>
            </form>
          </div>
        </div>
      )}

      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
          <div className="w-full max-w-sm rounded-t-xl border border-line bg-surface p-6 sm:rounded-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">Ubah Target Nominal</h2>
              <button
                type="button"
                onClick={closeEdit}
                aria-label="Tutup"
                className="text-secondary hover:text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="flex flex-col gap-3">
              <p className="truncate text-sm text-secondary">
                {ruleLabel(editTarget)}
              </p>
              <AmountInput
                autoFocus
                value={editAmount}
                onChange={setEditAmount}
                placeholder="Nominal target per hari"
                className={inputClass}
              />
              {editError && (
                <p
                  role="alert"
                  className="rounded-lg bg-expense/10 px-3 py-2 text-sm text-expense"
                >
                  {editError}
                </p>
              )}
              <button
                type="submit"
                className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
              >
                Simpan
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

