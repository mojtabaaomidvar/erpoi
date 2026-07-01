// src/features/notifications/ui/NotificationTestPanel.tsx

import { useState } from 'react';
import { notificationService } from '../services/NotificationService';
import { useToast } from '../hooks/useToast';
import { NotificationCategory, NotificationType } from '../types';

interface TestScenario {
  label: string;
  icon: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
}

const scenarios: TestScenario[] = [
  {
    label: 'Contract Expiring',
    icon: '📄',
    type: 'warning',
    category: 'contract',
    title: 'Contract Expiring Soon',
    message: 'Contract #CTR-2024-001 is expiring in 15 days',
  },
  {
    label: 'Contract Expired',
    icon: '📄',
    type: 'error',
    category: 'contract',
    title: 'Contract Expired',
    message: 'Contract #CTR-2024-002 has expired and needs renewal',
  },
  {
    label: 'New Client',
    icon: '👤',
    type: 'success',
    category: 'client',
    title: 'New Client Added',
    message: 'Client "Total Pars Co." has been successfully added',
  },
  {
    label: 'Inspection Completed',
    icon: '🔍',
    type: 'success',
    category: 'inspection',
    title: 'Inspection Completed',
    message: 'Inspection #INS-2024-015 has been completed by Ali Rezai',
  },
  {
    label: 'Invoice Overdue',
    icon: '💰',
    type: 'error',
    category: 'invoice',
    title: 'Invoice Overdue',
    message: 'Invoice #INV-2024-008 is 30 days overdue',
  },
  {
    label: 'Invoice Paid',
    icon: '💰',
    type: 'success',
    category: 'invoice',
    title: 'Invoice Paid',
    message: 'Invoice #INV-2024-007 has been paid successfully',
  },
  {
    label: 'NCR Raised',
    icon: '⚠️',
    type: 'warning',
    category: 'ncr',
    title: 'NCR Raised',
    message: 'NCR #NCR-2024-003 raised for inspection #INS-2024-010',
  },
  {
    label: 'System Update',
    icon: '⚙️',
    type: 'info',
    category: 'system',
    title: 'System Maintenance',
    message: 'System will be down for maintenance on Friday 10 PM',
  },
];

export function NotificationTestPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  const handleScenario = (scenario: TestScenario, showToast: boolean) => {
    // ایجاد notification در Notification Center
    notificationService.create({
      type: scenario.type,
      category: scenario.category,
      title: scenario.title,
      message: scenario.message,
    });

    // نمایش toast
    if (showToast) {
      switch (scenario.type) {
        case 'success':
          showSuccess(scenario.title, scenario.message);
          break;
        case 'error':
          showError(scenario.title, scenario.message);
          break;
        case 'warning':
          showWarning(scenario.title, scenario.message);
          break;
        case 'info':
          showInfo(scenario.title, scenario.message);
          break;
      }
    }
  };

  const handleBulkTest = () => {
    scenarios.forEach((scenario, idx) => {
      setTimeout(() => {
        handleScenario(scenario, idx === 0); // فقط اولین toast رو نشون بده
      }, idx * 300);
    });
  };

  const handleClearAll = () => {
    notificationService.clearAll();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-indigo-700 transition-colors"
      >
        🧪 Test Notifications
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 w-96 max-h-[80vh] overflow-hidden">
      {/* Header */}
      <div className="bg-indigo-600 text-white px-4 py-3 flex items-center justify-between">
        <h3 className="font-bold">🧪 Notification Test Panel</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white hover:text-indigo-200 text-xl leading-none"
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div className="p-4 overflow-y-auto max-h-[calc(80vh-60px)]">
        {/* Quick Actions */}
        <div className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-2">
            Quick Actions
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleBulkTest}
              className="flex-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-2 rounded-lg text-sm font-medium hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
            >
              🎯 Test All Scenarios
            </button>
            <button
              onClick={handleClearAll}
              className="flex-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
            >
              🗑️ Clear All
            </button>
          </div>
        </div>

        {/* Scenarios */}
        <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-2">
          Individual Scenarios
        </div>
        <div className="space-y-2">
          {scenarios.map((scenario, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 rounded-lg p-2"
            >
              <span className="text-xl">{scenario.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                  {scenario.label}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {scenario.type} • {scenario.category}
                </div>
              </div>
              <button
                onClick={() => handleScenario(scenario, true)}
                className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              >
                + Toast
              </button>
              <button
                onClick={() => handleScenario(scenario, false)}
                className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                + Silent
              </button>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-2">
            Current Stats
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-2">
              <div className="font-bold text-blue-900 dark:text-blue-100">
                {notificationService.getAll().length}
              </div>
              <div className="text-blue-700 dark:text-blue-300">Total</div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded p-2">
              <div className="font-bold text-yellow-900 dark:text-yellow-100">
                {notificationService.getUnread().length}
              </div>
              <div className="text-yellow-700 dark:text-yellow-300">Unread</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}