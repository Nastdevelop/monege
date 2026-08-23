"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionRunner } from "@/components/action-overlay";

type Mode = "login" | "register";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const run = useActionRunner();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    await run(async () => {
      try {
        const res = await fetch(`/api/auth/${mode}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            mode === "register" ? { name, email, password } : { email, password }
          ),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error ?? "Terjadi kesalahan, coba lagi");
          return;
        }
        router.replace("/dashboard");
        router.refresh();
      } catch {
        setError("Tidak bisa menghubungi server");
      }
    });
  }

  const inputClass =
    "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-secondary focus:border-accent";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {mode === "register" && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-medium">
            Nama
          </label>
          <input
            id="name"
            type="text"
            required
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama kamu"
            className={inputClass}
          />
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nama@email.com"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={mode === "register" ? 8 : undefined}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={
            mode === "register" ? "Minimal 8 karakter" : "Password kamu"
          }
          className={inputClass}
        />
      </div>

      {error && (
        <p className="rounded-lg bg-expense/10 px-3 py-2 text-sm text-expense">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="mt-1 flex items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {mode === "login" ? "Masuk" : "Daftar"}
      </button>

      <p className="text-center text-sm text-secondary">
        {mode === "login" ? (
          <>
            Belum punya akun?{" "}
            <Link href="/register" className="font-semibold text-accent">
              Daftar
            </Link>
          </>
        ) : (
          <>
            Sudah punya akun?{" "}
            <Link href="/login" className="font-semibold text-accent">
              Masuk
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
