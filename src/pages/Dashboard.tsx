// src/pages/Dashboard.tsx
import { usePermission } from '@shared/authorization/hooks/usePermission';
import { useAuth } from '@features/auth/hooks/useAuth';

export function Dashboard() {
  const { user } = useAuth();
  const { can, canAny } = usePermission();

  // ✅ چک کردن دسترسی برای هر بخش
  const canViewClients = canAny(['client:read', 'client:view_all', 'client:view_own']);
  const canViewContracts = canAny(['contract:read', 'contract:view_all', 'contract:view_own']);
  const canViewInspections = canAny(['inspection:read', 'inspection:view_all', 'inspection:view_own']);
  const canViewInvoices = canAny(['invoice:read', 'invoice:view_all', 'invoice:view_own']);
  const canViewInspectors = canAny(['inspector:read', 'inspector:view_all']);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome back, {user?.fullName}!</h1>
        <p className="text-blue-100 mt-1">Here's your activity overview</p>
      </div>

      {/* KPI Cards - فقط بر اساس دسترسی */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {canViewClients && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="text-sm text-slate-500 dark:text-slate-400">My Clients</div>
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {/* تعداد مشتریان مرتبط با کاربر */}
              —
            </div>
          </div>
        )}

        {canViewContracts && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="text-sm text-slate-500 dark:text-slate-400">My Contracts</div>
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">—</div>
          </div>
        )}

        {canViewInspections && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="text-sm text-slate-500 dark:text-slate-400">My Inspections</div>
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">—</div>
          </div>
        )}

        {canViewInvoices && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="text-sm text-slate-500 dark:text-slate-400">My Invoices</div>
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">—</div>
          </div>
        )}
      </div>

      {/* Quick Actions - فقط بر اساس دسترسی */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {can('client:create') && (
            <button className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
              + New Client
            </button>
          )}
          {can('contract:create') && (
            <button className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
              + New Contract
            </button>
          )}
          {can('inspection:create') && (
            <button className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
              + New Inspection
            </button>
          )}
          {can('invoice:create') && (
            <button className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors">
              + New Invoice
            </button>
          )}
        </div>
      </div>
    </div>
  );
}