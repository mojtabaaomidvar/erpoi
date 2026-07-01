// src/features/audit-log/ui/AuditLogPanel.tsx
import { useState } from 'react';
import { useAuditLogs } from '../hooks/useAuditLogs';
import { AuditLogFilter, AuditLogLevel, AuditActorType, AuditLogEntry } from '../types';
import { AuditLogDetailModal } from './AuditLogDetailModal';

const levelColors: Record<AuditLogLevel, string> = {
  info: 'border-l-blue-500',
  warning: 'border-l-yellow-500',
  error: 'border-l-red-500',
  success: 'border-l-green-500',
};

const levelIcons: Record<AuditLogLevel, string> = {
  info: 'ℹ️',
  warning: '⚠️',
  error: '❌',
  success: '✅',
};

const levelBadgeColors: Record<AuditLogLevel, string> = {
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

const levelLabels: Record<AuditLogLevel, string> = {
  info: 'Info',
  warning: 'Warning',
  error: 'Error',
  success: 'Success',
};

export function AuditLogPanel() {
  const [filter, setFilter] = useState<AuditLogFilter>({});
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const { logs, isLoading, exportLogs } = useAuditLogs(filter);

  const handleSearch = (value: string) => {
    setSearch(value);
    setFilter({ ...filter, search: value });
  };

  const handleLevelFilter = (level: AuditLogLevel | undefined) => {
    setFilter({ ...filter, level });
  };

  const handleActorFilter = (actorType: AuditActorType | undefined) => {
    setFilter({ ...filter, actorType });
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              📋 Audit Log
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              System activity tracking and compliance records
            </p>
          </div>
          <button
            onClick={exportLogs}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            📥 Export JSON
          </button>
        </div>

        {/* Filters - Level و Actor در یک ردیف */}
        <div className="mb-6 space-y-4">
          <input
            type="text"
            placeholder="🔍 Search in logs..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
          />

          <div className="flex gap-4 flex-wrap items-center">
            {/* Level Filter */}
            <div className="flex gap-2 items-center">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Level:
              </span>
              <button
                onClick={() => handleLevelFilter(undefined)}
                className={`px-3 py-1 rounded-lg text-sm ${
                  !filter.level
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                All
              </button>
              {(['info', 'success', 'warning', 'error'] as AuditLogLevel[]).map(
                (level) => (
                  <button
                    key={level}
                    onClick={() => handleLevelFilter(level)}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      filter.level === level
                        ? levelBadgeColors[level]
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {levelIcons[level]} {levelLabels[level]}
                  </button>
                )
              )}
            </div>

            {/* Actor Filter */}
            <div className="flex gap-2 items-center">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Actor:
              </span>
              <button
                onClick={() => handleActorFilter(undefined)}
                className={`px-3 py-1 rounded-lg text-sm ${
                  !filter.actorType
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => handleActorFilter('user')}
                className={`px-3 py-1 rounded-lg text-sm ${
                  filter.actorType === 'user'
                    ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
                    : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                👤 Users
              </button>
              <button
                onClick={() => handleActorFilter('system')}
                className={`px-3 py-1 rounded-lg text-sm ${
                  filter.actorType === 'system'
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                    : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                🤖 System
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{logs.length}</div>
            <div className="text-sm text-blue-700 dark:text-blue-300">Total Logs</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {logs.filter(l => l.level === 'success').length}
            </div>
            <div className="text-sm text-green-700 dark:text-green-300">Success</div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
            <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
              {logs.filter(l => l.level === 'warning').length}
            </div>
            <div className="text-sm text-yellow-700 dark:text-yellow-300">Warnings</div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
            <div className="text-2xl font-bold text-red-900 dark:text-red-100">
              {logs.filter(l => l.level === 'error').length}
            </div>
            <div className="text-sm text-red-700 dark:text-red-300">Errors</div>
          </div>
        </div>

        {/* Table View */}
        {isLoading ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            No logs recorded yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Event</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Timestamp</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">User</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">IP</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Action</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr 
                    key={log.id} 
                    className={`border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer border-l-4 ${levelColors[log.level]}`}
                    onClick={() => setSelectedLog(log)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span>{levelIcons[log.level]}</span>
                        <div>
                          <div className="font-medium text-slate-900 dark:text-slate-100">{log.title}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{log.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                      {new Date(log.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4">
                      {log.actorType === 'system' ? (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          🤖 System
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                          👤 {log.userName}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm font-mono text-slate-600 dark:text-slate-400">
                      {log.ipAddress || 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium">
                        View Details →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedLog && (
        <AuditLogDetailModal 
          log={selectedLog} 
          onClose={() => setSelectedLog(null)} 
        />
      )}
    </>
  );
}