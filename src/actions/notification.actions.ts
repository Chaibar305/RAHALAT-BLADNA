"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface UserNotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  linkUrl?: string | null;
  createdAt: string;
}

/**
 * Récupère les vraies notifications de l'utilisateur connecté
 */
export async function getUserNotificationsAction(): Promise<{
  success: boolean;
  notifications: UserNotificationItem[];
  unreadCount: number;
}> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return { success: true, notifications: [], unreadCount: 0 };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return { success: true, notifications: [], unreadCount: 0 };
    }

    const dbNotifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const notifications: UserNotificationItem[] = dbNotifications.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      isRead: n.isRead,
      linkUrl: n.linkUrl,
      createdAt: n.createdAt.toISOString(),
    }));

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return { success: true, notifications, unreadCount };
  } catch (error) {
    console.error("Erreur récupération notifications:", error);
    return { success: false, notifications: [], unreadCount: 0 };
  }
}

/**
 * Marque une notification comme lue
 */
export async function markNotificationAsReadAction(notificationId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return { success: false, error: "Non autorisé" };
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Marque toutes les notifications comme lues
 */
export async function markAllNotificationsAsReadAction() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return { success: false, error: "Non autorisé" };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (user) {
      await prisma.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true },
      });
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Supprime une notification
 */
export async function deleteNotificationAction(notificationId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return { success: false, error: "Non autorisé" };
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
