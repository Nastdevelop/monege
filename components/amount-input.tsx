"use client";

function sanitize(raw: string): string {
  return raw.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 12);
}

export function AmountInput({
  value,
  onChange,
  id,
  placeholder = "0",
  className = "",
  disabled = false,
}: {
  value: string;
  onChange: (digits: string) => void;
  id?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}) {
  const digits = sanitize(value);
  const display = digits ? Number(digits).toLocaleString("id-ID") : "";

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-secondary">
        Rp
      </span>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        disabled={disabled}
        value={display}
        placeholder={placeholder}
        onChange={(e) => onChange(sanitize(e.target.value))}
        className={`tabular-nums pl-9 ${className}`}
      />
    </div>
  );
}
