"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, CalendarPlus } from "lucide-react";
import {
  createBill,
  updateBill,
  markBillPaid,
  deleteBill,
} from "@/lib/actions/bill";
import { formatIDR, formatDateID } from "@/lib/format";
import { AmountInput } from "@/components/amount-input";
import { useActionRunner } from "@/components/action-overlay";

export interface BillItem {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  isPaid: boolean;
  reminders: { id: string; remindAt: string; isSent: boolean }[];
}

type EditTarget = BillItem | null;

function billStatus(
  dueDate: string,
  isPaid: boolean
): { label: string; cls: string; dot: string } {
  if (isPaid)
    return { label: "Lunas", cls: "text-income", dot: "bg-income" };
  const days = Math.ceil(
    (new Date(dueDate).getTime() - Date.now()) / 86400000
  );
  if (days < 0) return { label: "Terlambat", cls: "text-expense", dot: "bg-expense" };
  if (days <= 3)
    return { label: "Mendekati", cls: "text-warning", dot: "bg-warning" };
  return { label: "Belum jatuh tempo", cls: "text-secondary", dot: "bg-secondary" };
}

export function BillsManager({ bills }: { bills: BillItem[] }) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EditTarget>(null);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [reminders, setReminders] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const run = useActionRunner();

  function closeAll() {
    setAddOpen(false);
    setEditTarget(null);
    setError(null);
    setTitle("");
    setAmount("");
    setDueDate("");
    setReminders([]);
  }

  function openEdit(b: BillItem) {
    setEditTarget(b);
    setTitle(b.title);
    setAmount(String(b.amount));
    setDueDate(b.dueDate.slice(0, 10));
    setReminders(
      b.reminders
        .filter((r) => !r.isSent)
        .map((r) => r.remindAt.slice(0, 10))
    );
    setError(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await run(() =>
        editTarget
          ? updateBill(editTarget.id, title, Number(amount), dueDate, reminders)
          : createBill(title, Number(amount), dueDate, reminders)
      );
      if (!res || !res.ok)
        return setError(res?.error ?? "Gagal menyimpan tagihan");
      closeAll();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleMarkPaid(id: string) {
    setBusy(true);
    try {
      const res = await run(() => markBillPaid(id));
      if (!res || !res.ok)
        window.alert(res?.error ?? "Gagal menandai tagihan lunas");
      else router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Hapus tagihan ini?")) return;
    setBusy(true);
    try {
      const res = await run(() => deleteBill(id));
      if (!res || !res.ok) window.alert(res?.error ?? "Gagal menghapus tagihan");
      else router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-secondary focus:border-accent";

  const sorted = [...bills].sort((a, b) =>
    a.isPaid === b.isPaid ? a.dueDate.localeCompare(b.dueDate) : a.isPaid ? 1 : -1
  );

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          closeAll();
          setAddOpen(true);
        }}
        className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
      >
        <Plus className="h-4 w-4" /> Tagihan
      </button>

      <div className="mt-5 flex flex-col gap-3">
        {sorted.length === 0 && (
          <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-line text-sm text-secondary">
            Belum ada tagihan.
          </div>
        )}
        {sorted.map((b) => {
          const st = billStatus(b.dueDate, b.isPaid);
          return (
            <div
              key={b.id}
              className={`rounded-xl border border-line bg-surface p-4 ${
                b.isPaid ? "opacity-60" : ""
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{b.title}</p>
                  <p className="tabular-nums mt-0.5 text-sm font-bold text-primary">
                    {formatIDR(b.amount)}
                  </p>
                </div>
                <span className={`flex items-center gap-1.5 text-xs font-semibold ${st.cls}`}>
                  <span className={`h-2 w-2 rounded-full ${st.dot}`} />
                  {st.label}
                </span>
              </div>

              <p className="mt-1.5 text-xs text-secondary">
                Jatuh tempo: {formatDateID(b.dueDate)}
              </p>

              {b.reminders.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {b.reminders.map((r) => (
                    <span
                      key={r.id}
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        r.isSent
                          ? "bg-muted-tag text-secondary line-through"
                          : "bg-accent/15 text-accent"
                      }`}
                    >
                      ingatkan {formatDateID(r.remindAt)}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-3 flex gap-2">
                {!b.isPaid && (
                  <button
                    type="button"
                    onClick={() => handleMarkPaid(b.id)}
                    className="rounded-lg bg-income/15 px-3 py-1.5 text-xs font-semibold text-income transition-colors hover:bg-income/25"
                  >
                    Tandai Lunas
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => openEdit(b)}
                  className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-secondary transition-colors hover:text-accent"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(b.id)}
                  className="ml-auto rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-secondary transition-colors hover:text-expense"
                >
                  Hapus
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {(addOpen || editTarget) && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
          <div className="max-h-[92vh] w-full max-w-sm overflow-y-auto rounded-t-xl border border-line bg-surface p-6 sm:rounded-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">
                {editTarget ? "Edit Tagihan" : "Tagihan Baru"}
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

            <form onSubmit={handleSave} className="flex flex-col gap-3">
              <input
                autoFocus
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nama tagihan (mis. Listrik)"
                maxLength={100}
                className={inputClass}
              />
              <AmountInput
                value={amount}
                onChange={setAmount}
                placeholder="Nominal"
                className={inputClass}
              />
              <label className="text-xs text-secondary">
                Tanggal jatuh tempo
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={`${inputClass} mt-1`}
                />
              </label>

              <div className="flex flex-col gap-2">
                <label className="text-xs text-secondary">
                  Tanggal reminder (bisa lebih dari satu)
                </label>
                {reminders.map((r, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="date"
                      required
                      value={r}
                      onChange={(e) =>
                        setReminders((prev) =>
                          prev.map((v, idx) => (idx === i ? e.target.value : v))
                        )
                      }
                      className={`${inputClass} flex-1`}
                    />
                    <button
                      type="button"
                      aria-label="Hapus reminder"
                      onClick={() =>
                        setReminders((prev) => prev.filter((_, idx) => idx !== i))
                      }
                      className="rounded-lg border border-line px-3 text-secondary hover:text-expense"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setReminders((prev) => [...prev, ""])}
                  className="inline-flex w-fit items-center gap-1 rounded-lg border border-dashed border-line px-3 py-1.5 text-xs font-medium text-secondary transition-colors hover:border-accent hover:text-accent"
                >
                  <CalendarPlus className="h-3.5 w-3.5" /> Tambah tanggal reminder
                </button>
              </div>

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
          </div>
        </div>
      )}
    </div>
  );
}

