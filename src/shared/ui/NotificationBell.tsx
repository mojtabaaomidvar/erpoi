// src/shared/ui/NotificationBell.tsx

import { useState, useEffect } from "react";
import { useTheme } from "@app/providers/ThemeProvider";
import { notificationService } from "@features/notifications/services/NotificationService";
import { amendmentService } from "@features/contract-management/services/AmendmentService";
import { ApprovalModal } from "@features/contract-management/ui/ApprovalModal";
import type { Notification } from "@features/notifications/types";
import type { Contract, ContractAmendment } from "@/types/contract";
import { AnimatedCollapse } from "@shared/ui/AnimatedCollapse";
import { supabase } from "@shared/database/supabase";
import { useEvent, EVENT_TYPES } from "@infra/events";
import type { DomainEvent } from "@infra/events";
import { showToast } from "@shared/ui/ToastContainer";

export function NotificationBell() {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null,
  );
  const [selectedAmendment, setSelectedAmendment] =
    useState<ContractAmendment | null>(null);

  // 🔧 FIX: تعریف loadNotifications قبل از useEffect
  const loadNotifications = () => {
    const all = notificationService.getAll();
    setNotifications(all.slice(0, 10));
    setUnreadCount(notificationService.getUnread().length);
  };

  useEvent<{ title: string; notificationId: string }>(
    EVENT_TYPES.NOTIFICATION_CREATED,
    (event: DomainEvent<{ title: string; notificationId: string }>) => {
      console.log("[NotificationBell] New notification:", event.payload.title);
      loadNotifications();
    },
  );

  useEvent(EVENT_TYPES.AMENDMENT_APPROVED, () => {
    loadNotifications();
  });

  useEvent(EVENT_TYPES.AMENDMENT_REJECTED, () => {
    loadNotifications();
  });

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  // src/shared/ui/NotificationBell.tsx

  // src/shared/ui/NotificationBell.tsx

  const handleNotificationClick = async (notif: Notification) => {
    notificationService.markAsRead(notif.id);

    if (notif.metadata?.amendmentId && notif.metadata?.contractId) {
      const amendmentId = notif.metadata.amendmentId as string;
      const contractId = notif.metadata.contractId as string;

      try {
        // 🔧 FIX: دریافت آخرین وضعیت amendment
        const amendment = await amendmentService.getById(amendmentId);
        if (!amendment) {
          console.error("[NotificationBell] Amendment not found:", amendmentId);
          showToast("error", "Not Found", "Amendment not found");
          return;
        }

        // 🔧 NEW: بررسی وضعیت فعلی
        console.log(
          "[NotificationBell] 🔍 Amendment status:",
          amendment.approval_status,
        );

        // دریافت contract
        const { data: contract, error } = await supabase
          .from("contracts")
          .select("*")
          .eq("id", contractId)
          .single();

        if (error || !contract) {
          console.error("[NotificationBell] Contract not found:", contractId);
          showToast("error", "Not Found", "Contract not found");
          return;
        }

        setSelectedContract(contract as Contract);
        setSelectedAmendment(amendment);
        setIsApprovalModalOpen(true);
        setIsOpen(false);
      } catch (error) {
        console.error(
          "[NotificationBell] Failed to load amendment/contract:",
          error,
        );
        showToast("error", "Error", "Failed to load amendment details");
      }
    }

    loadNotifications();
  };

  const handleMarkAsRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    notificationService.markAsRead(id);
    loadNotifications();
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
    loadNotifications();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    notificationService.delete(id);
    loadNotifications();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "success":
        return "✅";
      case "warning":
        return "⚠️";
      case "error":
        return "❌";
      default:
        return "ℹ️";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "success":
        return isDark ? "text-emerald-400" : "text-emerald-600";
      case "warning":
        return isDark ? "text-amber-400" : "text-amber-600";
      case "error":
        return isDark ? "text-rose-400" : "text-rose-600";
      default:
        return isDark ? "text-indigo-400" : "text-indigo-600";
    }
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative p-2 rounded-lg transition-all hover:scale-105 ${
            isDark
              ? "hover:bg-slate-700 text-slate-300"
              : "hover:bg-slate-100 text-slate-700"
          }`}
        >
          <span className="text-xl">🔔</span>

          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold animate-pulse">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        <AnimatedCollapse isOpen={isOpen}>
          <div
            className={`absolute right-0 top-full mt-2 w-96 rounded-xl border shadow-2xl z-50 ${
              isDark
                ? "border-slate-700 bg-slate-800"
                : "border-slate-200 bg-white"
            }`}
          >
            <div
              className={`flex items-center justify-between p-3 border-b ${
                isDark ? "border-slate-700" : "border-slate-200"
              }`}
            >
              <h3
                className={`text-sm font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
              >
                Notifications
                {unreadCount > 0 && (
                  <span
                    className={`ml-2 text-[10px] px-1.5 py-0.5 rounded ${
                      isDark
                        ? "bg-rose-900/50 text-rose-300"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {unreadCount} unread
                  </span>
                )}
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className={`text-[10px] px-2 py-1 rounded transition-colors ${
                    isDark
                      ? "text-indigo-400 hover:bg-indigo-900/30"
                      : "text-indigo-600 hover:bg-indigo-50"
                  }`}
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div
                  className={`text-center py-8 text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
                >
                  <div className="text-3xl mb-2">📭</div>
                  <p>No notifications</p>
                </div>
              ) : (
                <div
                  className={`divide-y ${isDark ? "divide-slate-700/50" : "divide-slate-200/70"}`}
                >
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3 transition-colors cursor-pointer ${
                        !notif.isRead
                          ? isDark
                            ? "bg-indigo-950/20"
                            : "bg-indigo-50/50"
                          : ""
                      } ${isDark ? "hover:bg-slate-700/50" : "hover:bg-slate-50"}`}
                    >
                      <div className="flex items-start gap-2">
                        <span className={`text-lg ${getTypeColor(notif.type)}`}>
                          {getTypeIcon(notif.type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div
                            className={`text-xs font-semibold mb-0.5 ${
                              isDark ? "text-slate-100" : "text-slate-900"
                            }`}
                          >
                            {notif.title}
                          </div>
                          <div
                            className={`text-[10px] mb-1 ${
                              isDark ? "text-slate-400" : "text-slate-600"
                            }`}
                          >
                            {notif.message}
                          </div>
                          <div
                            className={`text-[9px] ${isDark ? "text-slate-500" : "text-slate-400"}`}
                          >
                            {new Date(notif.timestamp).toLocaleString("fa-IR")}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {!notif.isRead && (
                            <button
                              onClick={(e) => handleMarkAsRead(notif.id, e)}
                              className={`p-1 rounded text-[10px] ${
                                isDark
                                  ? "text-indigo-400 hover:bg-indigo-900/30"
                                  : "text-indigo-600 hover:bg-indigo-50"
                              }`}
                              title="Mark as read"
                            >
                              ✓
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDelete(notif.id, e)}
                            className={`p-1 rounded text-[10px] ${
                              isDark
                                ? "text-rose-400 hover:bg-rose-900/30"
                                : "text-rose-600 hover:bg-rose-50"
                            }`}
                            title="Delete"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </AnimatedCollapse>
      </div>

      {isApprovalModalOpen && selectedContract && selectedAmendment && (
        <ApprovalModal
          isOpen={isApprovalModalOpen}
          onClose={() => {
            setIsApprovalModalOpen(false);
            setSelectedContract(null);
            setSelectedAmendment(null);
          }}
          contract={selectedContract}
          amendment={selectedAmendment}
          onSuccess={() => {
            loadNotifications();
          }}
        />
      )}
    </>
  );
}
