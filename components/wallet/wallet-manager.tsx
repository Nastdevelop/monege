"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import {
  createWallet,
  updateWallet,
  deleteWallet,
  transferBetweenWallets,
} from "@/lib/actions/wallet";
import { formatIDR } from "@/lib/format";
import { AmountInput } from "@/components/amount-input";
import { useActionRunner } from "@/components/action-overlay";

export interface WalletItem {
  id: string;
  name: string;
  balance: number;
  isDefault: boolean;
  txCount: number;
}

type DialogKind = null | "add" | "edit" | "transfer" | { edit: WalletItem };

export function WalletManager({ wallets }: { wallets: WalletItem[] }) {
  const router = useRouter();
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const run = useActionRunner();

  function openAdd() {
    setDialog("add");
    setName("");
    setBalance("");
    setError(null);
  }

  function openEdit(w: WalletItem) {
    setDialog({ edit: w });
    setName(w.name);
    setError(null);
  }

  function openTransfer() {
    setDialog("transfer");
    setTransferFrom(wallets[0]?.id ?? "");
    setTransferTo(wallets[1]?.id ?? "");
    setTransferAmount("");
    setError(null);
  }

  function close() {
    setDialog(null);
    setError(null);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await run(() => createWallet(name, Number(balance) || 0));
      if (!res || !res.ok)
        return setError(res?.error ?? "Gagal menambahkan wallet");
      close();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    const target = dialog && typeof dialog === "object" ? dialog.edit : null;
    if (!target) return;
    setError(null);
    setBusy(true);
    try {
      const res = await run(() => updateWallet(target.id, name));
      if (!res || !res.ok)
        return setError(res?.error ?? "Gagal menyimpan perubahan wallet");
      close();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(w: WalletItem) {
    setError(null);
    setBusy(true);
    try {
      const first = await run(() => deleteWallet(w.id, false));
      if (!first || (first.ok !== true && first.error !== "CONFIRM_NEEDED")) {
        return setError(first?.error ?? "Gagal menghapus wallet");
      }
      if (!first.ok) {
        const sure = window.confirm(
          `Wallet "${w.name}" masih punya saldo/riwayat transaksi. Hapus beserta seluruh riwayatnya? Tindakan ini tidak bisa dibatalkan.`
        );
        if (!sure) return;
        const res = await run(() => deleteWallet(w.id, true));
        if (!res || !res.ok)
          return setError(res?.error ?? "Gagal menghapus wallet");
      }
      router.refresh();
      close();
    } finally {
      setBusy(false);
    }
  }

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await run(() =>
        transferBetweenWallets(transferFrom, transferTo, Number(transferAmount))
      );
      if (!res || !res.ok)
        return setError(res?.error ?? "Gagal melakukan transfer antar wallet");
      close();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-secondary focus:border-accent";

  return (
    <div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Wallet
        </button>
        {wallets.length >= 2 && (
          <button
            type="button"
            onClick={openTransfer}
            className="rounded-lg border border-line bg-surface px-4 py-2 text-sm font-semibold transition-colors hover:bg-surface-hover"
          >
            Transfer
          </button>
        )}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {wallets.map((w) => (
          <div
            key={w.id}
            className="group relative rounded-xl border border-line bg-surface p-5 transition-colors hover:bg-surface-hover"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link
                  href={`/dashboard/wallets/${w.id}`}
                  className="text-base font-semibold hover:text-accent"
                >
                  {w.name}
                </Link>
                {w.isDefault && (
                  <span className="ml-2 rounded-full bg-muted-tag px-2 py-0.5 text-[11px] font-medium text-secondary">
                    default
                  </span>
                )}
                <p className="tabular-nums mt-2 text-xl font-bold">
                  {formatIDR(w.balance)}
                </p>
                <p className="mt-1 text-xs text-secondary">
                  {w.txCount} transaksi
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100 max-sm:opacity-100">
              <button
                type="button"
                onClick={() => openEdit(w)}
                className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-secondary transition-colors hover:text-accent"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleDelete(w)}
                className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-secondary transition-colors hover:text-expense"
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
        {wallets.length === 0 && (
          <p className="text-sm text-secondary">Belum ada wallet.</p>
        )}
      </div>

      {dialog !== null && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
          <div className="w-full max-w-sm rounded-t-xl border border-line bg-surface p-6 sm:rounded-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">
                {dialog === "add"
                  ? "Wallet Baru"
                  : dialog === "transfer"
                    ? "Transfer Antar Wallet"
                    : "Edit Wallet"}
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="Tutup"
                className="text-secondary hover:text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {(dialog === "add" ||
              (typeof dialog === "object" && "edit" in dialog)) && (
              <form
                onSubmit={dialog === "add" ? handleAdd : handleEdit}
                className="flex flex-col gap-3"
              >
                <input
                  autoFocus
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama wallet"
                  maxLength={50}
                  className={inputClass}
                />
                {dialog === "add" && (
                  <AmountInput
                    value={balance}
                    onChange={setBalance}
                    placeholder="Saldo awal (opsional)"
                    className={inputClass}
                  />
                )}
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
            )}

            {dialog === "transfer" && (
              <form onSubmit={handleTransfer} className="flex flex-col gap-3">
                <select
                  value={transferFrom}
                  onChange={(e) => setTransferFrom(e.target.value)}
                  aria-label="Dari wallet"
                  className={inputClass}
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      Dari: {w.name} ({formatIDR(w.balance)})
                    </option>
                  ))}
                </select>
                <select
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  aria-label="Ke wallet"
                  className={inputClass}
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      Ke: {w.name}
                    </option>
                  ))}
                </select>
                <AmountInput
                  value={transferAmount}
                  onChange={setTransferAmount}
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
                  disabled={busy}
                  className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background disabled:opacity-60"
                >
                  Transfer
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
