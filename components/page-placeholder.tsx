export function PagePlaceholder({
  title,
  desc,
}: {
  title: string;
  desc: string;
}) {
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-secondary">{desc}</p>
      <div className="mt-8 flex h-48 items-center justify-center rounded-xl border border-dashed border-line bg-surface text-sm text-secondary">
        Modul ini akan dibangun pada tahap berikutnya
      </div>
    </div>
  );
}
