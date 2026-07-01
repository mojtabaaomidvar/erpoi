// src/features/notifications/ui/NotificationCenter.tsx

import { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationCategory, NotificationType } from '../types';

interface Props {
  onClose: () => void;
}

const categoryLabels: Record<NotificationCategory, string> = {
  contract: 'Contract',
  client: 'Client',
  inspection: 'Inspection',
  invoice: 'Invoice',
  ncr: 'NCR',
  system: 'System',
  general: 'General',
};

const categoryColors: Record<NotificationCategory, string> = {
  contract: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  client: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  inspection: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  invoice: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  ncr: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  system: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  general: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
};

const typeIcons: Record<NotificationType, string> = {
  info: '️',
  success: '✅',
  warning: '⚠️',
  error: '❌',
};

export function NotificationCenter({ onClose }: Props) {
  const { notifications, stats, markAsRead, markAllAsRead, toggleStar, deleteNotification } = useNotifications();

  return (
    <div className="absolute top-full right-0 mt-2 w-96 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 max-h-[600px] overflow-hidden">
      {/* Header */}
      <div className="bg-slate-100 dark:bg-slate-900 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            🔔 Notifications
          </h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xl leading-none"
          >
            ×
          </button>
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-600 dark:text-slate-400">
            {stats.unread} unread of {stats.total}
          </span>
          {stats.unread > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="overflow-y-auto max-h-[500px]">
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <div className="text-4xl mb-2">🔕</div>
            <div className="text-sm">No notifications yet</div>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`px-4 py-3 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                !notif.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Star Button */}
                <button
                  onClick={() => toggleStar(notif.id)}
                  className="text-lg mt-0.5 hover:scale-110 transition-transform"
                  title={notif.isStarred ? 'Unstar' : 'Star'}
                >
                  {notif.isStarred ? '⭐' : '☆'}
                </button>
                
                <div className="flex-1 min-w-0">
                  {/* Title Row with Category Label */}
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm">{typeIcons[notif.type]}</span>
                    <h4 className={`text-sm font-semibold flex-1 ${
                      notif.isRead ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-slate-100'
                    }`}>
                      {notif.title}
                    </h4>
                    {/* Category Label */}
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${categoryColors[notif.category]}`}>
                      {categoryLabels[notif.category]}
                    </span>
                  </div>
                  
                  {/* Message */}
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                    {notif.message}
                  </p>
                  
                  {/* Timestamp & Actions */}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-slate-500 dark:text-slate-500">
                      {new Date(notif.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <div className="flex gap-2">
                      {!notif.isRead && (
                        <button
                          onClick={() => markAsRead(notif.id)}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                          Mark read
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notif.id)}
                        className="text-xs text-red-600 dark:text-red-400 hover:underline font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}