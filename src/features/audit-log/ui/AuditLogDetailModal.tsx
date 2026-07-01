// src/features/audit-log/ui/AuditLogDetailModal.tsx
import { AuditLogEntry } from '../types';
import { formatAuditValue, formatFieldName } from '../utils/formatAuditValue';

interface Props {
  log: AuditLogEntry;
  onClose: () => void;
}

const levelBorderColors = {
  info: 'border-blue-500',
  warning: 'border-yellow-500',
  error: 'border-red-500',
  success: 'border-green-500',
};

const levelBgColors = {
  info: 'bg-blue-50 dark:bg-blue-900/20',
  warning: 'bg-yellow-50 dark:bg-yellow-900/20',
  error: 'bg-red-50 dark:bg-red-900/20',
  success: 'bg-green-50 dark:bg-green-900/20',
};

/**
 * نمایش یک تغییر فیلد به شکل human-readable
 */
function FieldChangeDisplay({ fieldChange }: { fieldChange: any }) {
  const { field, before, after, diff } = fieldChange;
  const fieldName = formatFieldName(field);

  // اگر فیلد آرایه هست و deep diff داره
  if (diff && diff.type === 'array') {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
        <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
          <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-0.5 rounded text-xs font-mono">
            {fieldName}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">(Array)</span>
        </div>

        <div className="space-y-3">
          {/* Added Items */}
          {diff.added && diff.added.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-green-600 dark:text-green-400 mb-2">
                ➕ Added ({diff.added.length})
              </div>
              <div className="space-y-1">
                {diff.added.map((item: any, idx: number) => (
                  <div key={idx} className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-2">
                    <div className="text-sm text-slate-900 dark:text-slate-100">
                      {formatAuditValue(item)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Removed Items */}
          {diff.removed && diff.removed.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-red-600 dark:text-red-400 mb-2">
                🗑️ Removed ({diff.removed.length})
              </div>
              <div className="space-y-1">
                {diff.removed.map((item: any, idx: number) => (
                  <div key={idx} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-2">
                    <div className="text-sm text-slate-900 dark:text-slate-100 line-through opacity-70">
                      {formatAuditValue(item)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Updated Items */}
          {diff.updated && diff.updated.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2">
                ️ Updated ({diff.updated.length})
              </div>
              {diff.updated.map((change: any, idx: number) => (
                <div key={idx} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3">
                  <div className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-2">
                    {formatAuditValue(change.after)}
                  </div>
                  {change.fieldChanges && change.fieldChanges.length > 0 && (
                    <div className="space-y-1 mt-2">
                      {change.fieldChanges.map((fc: any, fIdx: number) => (
                        <div key={fIdx} className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 p-1 rounded">
                            {formatAuditValue(fc.before)}
                          </div>
                          <div className="text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 p-1 rounded">
                            {formatAuditValue(fc.after)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // اگر فیلد object هست و deep diff داره
  if (diff && diff.type === 'object') {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
        <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
          <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-0.5 rounded text-xs font-mono">
            {fieldName}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">(Object)</span>
        </div>

        {diff.fieldChanges && diff.fieldChanges.length > 0 && (
          <div className="space-y-2">
            {diff.fieldChanges.map((fc: any, idx: number) => (
              <div key={idx} className="bg-slate-50 dark:bg-slate-900 rounded p-2">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {formatFieldName(fc.field)}:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 p-1 rounded">
                    {formatAuditValue(fc.before)}
                  </div>
                  <div className="text-xs text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 p-1 rounded">
                    {formatAuditValue(fc.after)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // primitive ساده
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
      <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
        <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-0.5 rounded text-xs font-mono">
          {fieldName}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-red-600 dark:text-red-400 font-semibold mb-1.5">❌ Before</div>
          <div className="text-sm text-slate-900 dark:text-slate-100 bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-800">
            {formatAuditValue(before)}
          </div>
        </div>
        <div>
          <div className="text-xs text-green-600 dark:text-green-400 font-semibold mb-1.5">✅ After</div>
          <div className="text-sm text-slate-900 dark:text-slate-100 bg-green-50 dark:bg-green-900/20 p-2 rounded border border-green-200 dark:border-green-800">
            {formatAuditValue(after)}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuditLogDetailModal({ log, onClose }: Props) {
  const payload = log.payload as any;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className={`bg-white dark:bg-slate-800 rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden border-t-4 ${levelBorderColors[log.level]}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-100 dark:bg-slate-900 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {log.title}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {log.description}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] bg-white dark:bg-slate-800">
          {/* Meta Info */}
          <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Event ID</div>
              <div className="text-sm font-mono text-slate-900 dark:text-slate-100">{log.id}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Timestamp</div>
              <div className="text-sm text-slate-900 dark:text-slate-100">
                {new Date(log.timestamp).toLocaleString('en-US')}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Actor</div>
              <div className="text-sm text-slate-900 dark:text-slate-100">
                {log.actorType === 'system' ? '🤖 System' : `👤 ${log.userName}`}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">IP Address</div>
              <div className="text-sm font-mono text-slate-900 dark:text-slate-100">{log.ipAddress || 'N/A'}</div>
            </div>
          </div>

          {/* Changes Detail */}
          {payload && typeof payload === 'object' && (
            <div className="space-y-6">
              {/* Primitive Changes */}
              {payload.changeType === 'primitive_change' && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
                    🔄 Value Changed
                  </h3>
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-red-600 dark:text-red-400 font-semibold mb-2">❌ Before</div>
                        <div className="text-sm text-slate-900 dark:text-slate-100 bg-red-50 dark:bg-red-900/30 p-3 rounded border border-red-200 dark:border-red-800">
                          {formatAuditValue(payload.oldValue)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-green-600 dark:text-green-400 font-semibold mb-2">✅ After</div>
                        <div className="text-sm text-slate-900 dark:text-slate-100 bg-green-50 dark:bg-green-900/30 p-3 rounded border border-green-200 dark:border-green-800">
                          {formatAuditValue(payload.newValue)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Updated Items with Deep Diff */}
              {payload.updated && payload.updated.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
                    ✏️ Updated Items ({payload.updated.length})
                  </h3>
                  <div className="space-y-4">
                    {payload.updated.map((change: any, idx: number) => {
                      const itemName = formatAuditValue(change.after);

                      return (
                        <div key={idx} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                          <div className="bg-blue-50 dark:bg-blue-900/30 px-4 py-2 border-b border-slate-200 dark:border-slate-700">
                            <div className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                              📝 {itemName}
                            </div>
                          </div>

                          <div className="p-4 space-y-3">
                            {change.fieldChanges && change.fieldChanges.length > 0 ? (
                              <>
                                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                                  Changed Fields ({change.fieldChanges.length})
                                </div>
                                {change.fieldChanges.map((fc: any, fIdx: number) => (
                                  <FieldChangeDisplay key={fIdx} fieldChange={fc} />
                                ))}
                              </>
                            ) : (
                              <div className="text-sm text-slate-500 dark:text-slate-400 italic">
                                No field-level changes detected
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Added Items */}
              {payload.added && payload.added.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
                     Added Items ({payload.added.length})
                  </h3>
                  <div className="space-y-2">
                    {payload.added.map((item: any, idx: number) => (
                      <div key={idx} className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                        <div className="text-sm text-slate-900 dark:text-slate-100">
                          {formatAuditValue(item)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Removed Items */}
              {payload.removed && payload.removed.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
                    🗑️ Removed Items ({payload.removed.length})
                  </h3>
                  <div className="space-y-2">
                    {payload.removed.map((item: any, idx: number) => (
                      <div key={idx} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                        <div className="text-sm text-slate-900 dark:text-slate-100 line-through opacity-70">
                          {formatAuditValue(item)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 dark:bg-slate-900 px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}