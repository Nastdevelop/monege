"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteTransaction } from "@/lib/actions/transaction";
import { formatIDR, formatDateID } from "@/lib/format";
import { useActionRunner } from "@/components/action-overlay";
import {
  TransactionFormDialog,
  EditTriggerIcon,
  type WalletOption,
  type TagOption,
} from "./transaction-form";

export interface TransactionRowData {
  id: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  note: string | null;
  date: string;
  tagName: string;
  tagKind: "INCOME" | "EXPENSE";
  walletName: string;
}

export function TransactionList({
  items,
  wallets,
  tags,
  showWallet = true,
  emptyText = "Belum ada transaksi",
}: {
  items: TransactionRowData[];
  wallets: WalletOption[];
  tags: TagOption[];
  showWallet?: boolean;
  emptyText?: string;
}) {
  const router = useRouter();
  const run = useActionRunner();

  async function handleDelete(id: string) {
    if (!window.confirm("Hapus transaksi ini? Saldo akan disesuaikan.")) return;
    const res = await run(() => deleteTransaction(id));
    if (!res || !res.ok) {
      window.alert(res?.error ?? "Gagal menghapus transaksi");
      return;
    }
    router.refresh();
  }

  if (items.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-line text-sm text-secondary">
        {emptyText}
      </div>
    );
  }

  return (
    <ul className={`flex flex-col gap-2`}>
      {items.map((tx) => (
        <li
          key={tx.id}
          className="group flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-muted-tag px-2 py-0.5 text-xs font-medium">
                {tx.tagName}
              </span>
              {showWallet && (
                <span className="text-xs text-secondary">{tx.walletName}</span>
              )}
            </div>
            <p className="mt-1 truncate text-sm text-secondary">
              {tx.note || formatDateID(tx.date)}
            </p>
            <p className="text-xs text-secondary sm:hidden">
              {formatDateID(tx.date)}
            </p>
          </div>

          <span
            className={`tabular-nums whitespace-nowrap text-sm font-semibold ${
              tx.type === "INCOME" ? "text-income" : "text-expense"
            }`}
          >
            {tx.type === "INCOME" ? "+" : "-"}
            {formatIDR(tx.amount)}
          </span>

          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 max-sm:opacity-100">
            <TransactionFormDialog
              wallets={wallets}
              tags={tags}
              initial={{
                id: tx.id,
                walletId: wallets.find((w) => w.name === tx.walletName)?.id ?? "",
                tagId: tags.find((t) => t.name === tx.tagName)?.id ?? "",
                type: tx.type === "INCOME" ? "INCOME" : "EXPENSE",
                amount: tx.amount,
                note: tx.note,
                date: tx.date,
              }}
              triggerLabel=""
              triggerClassName="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line text-secondary hover:text-accent"
              triggerIcon={<EditTriggerIcon />}
            />
            <button
              type="button"
              onClick={() => handleDelete(tx.id)}
              aria-label="Hapus transaksi"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line text-secondary transition-colors hover:text-expense"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
