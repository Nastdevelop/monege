import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { NotificationsPanel } from "@/components/notifications-panel";

export async function NotificationsBell() {
  const user = await getSessionUser();
  if (!user) return null;

  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
    prisma.notification.count({
      where: { userId: user.id, isRead: false },
    }),
  ]);

  return (
    <NotificationsPanel
      unreadCount={unreadCount}
      items={items.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
      }))}
    />
  );
}
