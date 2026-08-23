import "server-only";
import webpush from "web-push";
import { prisma } from "@/lib/prisma";

let configured = false;

function ensureConfigured(): boolean {
  if (configured) return true;
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return false;
  webpush.setVapidDetails(
    VAPID_SUBJECT ?? "mailto:admin@monege.app",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
  configured = true;
  return true;
}

export interface PushPayload {
  type: "BILL_REMINDER" | "BUDGET_OVER" | "BUDGET_UNDER";
  title: string;
  message: string;
}

export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<void> {
  await prisma.notification.create({
    data: {
      userId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
    },
  });

  if (!ensureConfigured()) return;

  const subs = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  const body = JSON.stringify({ title: payload.title, body: payload.message });

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          body
        );
      } catch (err) {
        const statusCode =
          typeof err === "object" && err !== null && "statusCode" in err
            ? Number((err as { statusCode?: number }).statusCode)
            : 0;
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription
            .deleteMany({ where: { endpoint: sub.endpoint } })
            .catch(() => undefined);
        }
      }
    })
  );
}
