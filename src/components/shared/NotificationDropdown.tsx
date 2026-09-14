"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { 
  Bell, Check, Sparkles, ShieldCheck, 
  CreditCard, Compass, ExternalLink, X, Info 
} from "lucide-react";
import {
  getUserNotificationsAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  deleteNotificationAction,
  UserNotificationItem,
} from "@/actions/notification.actions";

export function NotificationDropdown() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = useTranslations("nav");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<UserNotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Charger les vraies notifications au montage
  useEffect(() => {
    let isMounted = true;
    async function loadNotifications() {
      setIsLoading(true);
      try {
        const res = await getUserNotificationsAction();
        if (isMounted && res.success) {
          setNotifications(res.notifications);
        }
      } catch (err) {
        console.error("Erreur chargement notifications:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadNotifications();
    return () => {
      isMounted = false;
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await markAllNotificationsAsReadAction();
    } catch (err) {
      console.error("Erreur markAllAsRead:", err);
    }
  };

  const removeNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await deleteNotificationAction(id);
    } catch (err) {
      console.error("Erreur removeNotification:", err);
    }
  };

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    try {
      await markNotificationAsReadAction(id);
    } catch (err) {
      console.error("Erreur markAsRead:", err);
    }
  };

  // Fermer au clic extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case "DEPARTURE_GUARANTEED":
        return <ShieldCheck className="w-4 h-4 text-tp-ok-fg" />;
      case "PAYMENT_CONFIRMED":
        return <CreditCard className="w-4 h-4 text-tp-cyan-hover" />;
      case "NEW_TRIP_AVAILABLE":
        return <Sparkles className="w-4 h-4 text-tp-terracotta" />;
      case "TRIP_REMINDER":
        return <Compass className="w-4 h-4 text-tp-cyan" />;
      default:
        return <Info className="w-4 h-4 text-tp-cyan" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-9 h-9 rounded-xl border border-tp-line hover:border-tp-cyan text-tp-midnight hover:bg-tp-surface-2 flex items-center justify-center transition-all shadow-tp-sm active:scale-90"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 rtl:-right-auto rtl:-left-1 w-4 h-4 rounded-full bg-tp-cyan text-white text-[10px] font-black flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-tp-line/80 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-4 pb-3 border-b border-tp-line flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-tp-midnight">
                {t("notifications")}
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-tp-cyan-tint text-tp-cyan-hover text-[11px] font-extrabold">
                  {unreadCount} {isAr ? "جديدة" : "nouvelles"}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] font-bold text-tp-cyan-hover hover:underline flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{t("markAllAsRead")}</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-tp-line/60">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-tp-muted font-medium space-y-2">
                <Bell className="w-6 h-6 text-slate-300 mx-auto" />
                <p>{isAr ? "لا توجد أي إشعارات حالياً" : "Aucune notification pour le moment"}</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markAsRead(notif.id)}
                  className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                    notif.isRead
                      ? "bg-white hover:bg-tp-surface-2"
                      : "bg-tp-cyan-tint/25 hover:bg-tp-cyan-tint/40"
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-tp-cream flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    {getIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-black text-xs text-tp-midnight truncate">
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-tp-muted shrink-0 font-mono">
                        {new Date(notif.createdAt).toLocaleDateString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <p className="text-[11.5px] text-tp-slate leading-snug">
                      {notif.message}
                    </p>

                    {notif.linkUrl && (
                      <Link
                        href={notif.linkUrl}
                        onClick={() => setIsOpen(false)}
                        className="inline-flex items-center gap-1 text-[11px] font-extrabold text-tp-cyan-hover hover:underline pt-1"
                      >
                        <span>{isAr ? "عرض التفاصيل" : "Voir les détails"}</span>
                        <ExternalLink className="w-3 h-3 rtl:rotate-180" />
                      </Link>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(notif.id);
                    }}
                    className="text-tp-muted hover:text-red-500 p-1 transition"
                    aria-label="Supprimer notification"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
