"use client";

import { Moon, Sun } from "lucide-react";
import { updateThemePref } from "@/lib/actions/settings";

const STORAGE_KEY = "monege-theme";

export function ThemeToggle({ className = "" }: { className?: string }) {
  function toggle() {
    const next =
      document.documentElement.getAttribute("data-theme") === "soft-color"
        ? "DARK"
        : "SOFT_COLOR";
    const attr = next === "SOFT_COLOR" ? "soft-color" : "dark";
    document.documentElement.setAttribute("data-theme", attr);
    try {
      localStorage.setItem(STORAGE_KEY, attr);
    } catch {}
    updateThemePref(next).catch(() => undefined);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Ganti tema"
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-secondary transition-colors hover:bg-surface-hover hover:text-primary ${className}`}
    >
      <Sun className="h-4 w-4 hidden [html[data-theme='dark']_&]:block" />
      <Moon className="h-4 w-4 hidden [html[data-theme='soft-color']_&]:block" />
    </button>
  );
}
