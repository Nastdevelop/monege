import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { PushSettings } from "@/components/settings/push-settings";
import { TagManager } from "@/components/settings/tag-manager";

export const metadata = { title: "Settings — Monege" };

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [tags, subs] = await Promise.all([
    prisma.tag.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
    }),
    prisma.pushSubscription.count({ where: { userId: user.id } }),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      <p className="mt-1 text-sm text-secondary">
        Preferensi tampilan, notifikasi, dan tag.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        <div className="flex items-center justify-between rounded-xl border border-line bg-surface p-5">
          <div>
            <h3 className="text-sm font-semibold">Tema</h3>
            <p className="mt-1 text-sm text-secondary">
              Preferensi tersimpan otomatis ke akunmu.
            </p>
          </div>
          <ThemeToggle />
        </div>

        <PushSettings />
        {subs > 0 && (
          <p className="-mt-2 text-xs text-secondary">
            {subs} perangkat terdaftar untuk menerima push.
          </p>
        )}

        <TagManager
          tags={tags.map((t) => ({ id: t.id, name: t.name, kind: t.kind }))}
        />
      </div>
    </div>
  );
}
