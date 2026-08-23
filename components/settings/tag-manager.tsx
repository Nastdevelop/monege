"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Check } from "lucide-react";
import {
  createTag,
  renameTag,
  deleteTag,
  updateTagKind,
} from "@/lib/actions/tag";
import { PROTECTED_TAGS } from "@/lib/constants";
import { useActionRunner } from "@/components/action-overlay";

export interface TagItem {
  id: string;
  name: string;
  kind: "INCOME" | "EXPENSE";
}

const kindLabel = { INCOME: "pemasukan", EXPENSE: "pengeluaran" };

export function TagManager({ tags }: { tags: TagItem[] }) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [newKind, setNewKind] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const actionRun = useActionRunner();

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    return actionRun(async () => {
      const res = await fn();
      if (!res.ok) {
        setError(res.error ?? "Gagal");
        return res;
      }
      router.refresh();
      return res;
    });
  }

  function handleCreate() {
    if (!newName.trim()) return;
    run(() => createTag(newName.trim(), newKind));
    setNewName("");
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <h3 className="text-sm font-semibold">Kelola Tag</h3>
      <p className="mt-1 text-xs text-secondary">
        Tag terpisah untuk pemasukan dan pengeluaran. Tag sistem tidak bisa
        diubah. Jenis hanya bisa diganti jika tag belum dipakai.
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nama tag baru"
          maxLength={50}
          className="w-full rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-secondary focus:border-accent"
        />
        <select
          value={newKind}
          onChange={(e) => setNewKind(e.target.value as "INCOME" | "EXPENSE")}
          aria-label="Jenis tag baru"
          className="rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        >
          <option value="EXPENSE">Pengeluaran</option>
          <option value="INCOME">Pemasukan</option>
        </select>
        <button
          type="button"
          onClick={handleCreate}
          aria-label="Tambah tag"
          className="inline-flex items-center justify-center rounded-lg bg-accent px-3 py-2 text-background transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-expense/10 px-3 py-2 text-sm text-expense">
          {error}
        </p>
      )}

      <ul className={`mt-4 flex flex-col gap-2`}>
        {tags.map((t) => {
          const isProtected = PROTECTED_TAGS.some((p) => p.name === t.name);
          return (
            <li
              key={t.id}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-line px-3 py-2"
            >
              {editingId === t.id ? (
                <>
                  <input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    maxLength={50}
                    className="min-w-0 flex-1 rounded-md border border-line bg-background px-2 py-1 text-sm outline-none focus:border-accent"
                  />
                  <button
                    type="button"
                    aria-label="Simpan nama tag"
                    onClick={() => {
                      if (!editValue.trim()) return;
                      run(() => renameTag(t.id, editValue.trim()));
                      setEditingId(null);
                    }}
                    className="text-income hover:brightness-110"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Batal edit tag"
                    onClick={() => setEditingId(null)}
                    className="text-secondary"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <span className="text-sm">{t.name}</span>

                  <button
                    type="button"
                    disabled={isProtected}
                    title={
                      isProtected
                        ? "Jenis tag sistem tidak bisa diubah"
                        : "Klik untuk ganti jenis (jika belum dipakai)"
                    }
                    onClick={() =>
                      run(() =>
                        updateTagKind(
                          t.id,
                          t.kind === "INCOME" ? "EXPENSE" : "INCOME"
                        )
                      )
                    }
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold transition-opacity ${
                      t.kind === "INCOME"
                        ? "bg-income/15 text-income"
                        : "bg-expense/15 text-expense"
                    } ${isProtected ? "cursor-not-allowed opacity-60" : "hover:opacity-80"}`}
                  >
                    {kindLabel[t.kind]}
                  </button>

                  {!isProtected && (
                    <>
                      <button
                        type="button"
                        aria-label={`Edit tag ${t.name}`}
                        onClick={() => {
                          setEditingId(t.id);
                          setEditValue(t.name);
                        }}
                        className="ml-auto text-[11px] font-semibold text-accent"
                      >
                        edit
                      </button>
                      <button
                        type="button"
                        aria-label={`Hapus tag ${t.name}`}
                        onClick={() => run(() => deleteTag(t.id))}
                        className="text-expense"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

