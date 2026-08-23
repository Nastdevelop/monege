"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, X, Check } from "lucide-react";
import { createTag } from "@/lib/actions/tag";

export interface PickerTag {
  id: string;
  name: string;
  kind: "INCOME" | "EXPENSE";
}

export function TagPickerModal({
  open,
  onClose,
  tags,
  kind,
  selectedId,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  tags: PickerTag[];
  kind: "INCOME" | "EXPENSE";
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [createMode, setCreateMode] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const filtered = tags.filter((t) =>
    t.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  function handleCreate() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setError(null);
    createTag(trimmed, kind).then((res) => {
      if (!res.ok || !res.id) {
        setError(res.error ?? "Gagal membuat tag");
        return;
      }
      router.refresh();
      onSelect(res.id);
      setCreateMode(false);
      setNewName("");
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center">
      <div className="flex max-h-[70vh] w-full max-w-sm flex-col rounded-t-xl border border-line bg-surface p-4 sm:rounded-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            Pilih tag {kind === "INCOME" ? "pemasukan" : "pengeluaran"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="text-secondary hover:text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari tag..."
            className="w-full rounded-lg border border-line bg-background py-2 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-secondary focus:border-accent"
          />
        </div>

        <ul className="mt-2 flex-1 overflow-y-auto">
          {filtered.length === 0 && !createMode && (
            <p className="py-6 text-center text-sm text-secondary">
              Tidak ada tag yang cocok.
            </p>
          )}
          {filtered.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(t.id);
                  onClose();
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-surface-hover ${
                  t.id === selectedId ? "text-accent" : ""
                }`}
              >
                <span>{t.name}</span>
                {t.id === selectedId && <Check className="h-4 w-4" />}
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-2 border-t border-line pt-2">
          {createMode ? (
            <div className="flex flex-col gap-2">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleCreate())}
                placeholder={`Nama tag baru`}
                maxLength={50}
                className="w-full rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none focus:border-accent"
              />
              {error && <p className="text-xs text-expense">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCreate}
                  className="flex-1 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-background"
                >
                  Buat & Pilih
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreateMode(false);
                    setError(null);
                  }}
                  className="rounded-lg border border-line px-3 py-2 text-sm text-secondary"
                >
                  Batal
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCreateMode(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-line px-3 py-2 text-xs font-medium text-secondary transition-colors hover:border-accent hover:text-accent"
            >
              <Plus className="h-3.5 w-3.5" /> Buat tag baru
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
