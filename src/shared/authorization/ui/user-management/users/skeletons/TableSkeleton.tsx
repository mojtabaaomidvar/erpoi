// src/shared/authorization/ui/user-management/components/skeletons/TableSkeleton.tsx

interface TableSkeletonProps {
  isDark: boolean;
  rows?: number;
}

export function TableSkeleton({ isDark, rows = 5 }: TableSkeletonProps) {
  return (
    <div
      className={`rounded-xl border overflow-hidden ${
        isDark ? "border-slate-700" : "border-slate-200"
      }`}
    >
      <table className="w-full">
        <thead className={isDark ? "bg-slate-800/50" : "bg-slate-50"}>
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold">User</th>
            <th className="px-4 py-3 text-left text-xs font-semibold">Role</th>
            <th className="px-4 py-3 text-left text-xs font-semibold">Department</th>
            <th className="px-4 py-3 text-left text-xs font-semibold">Permissions</th>
            <th className="px-4 py-3 text-right text-xs font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody
          className={`divide-y ${isDark ? "divide-slate-700" : "divide-slate-200"}`}
        >
          {[...Array(rows)].map((_, i) => (
            <tr key={i} className="animate-pulse">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
                  />
                  <div className="space-y-2">
                    <div
                      className={`h-4 w-24 rounded ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
                    />
                    <div
                      className={`h-3 w-16 rounded ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
                    />
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <div
                  className={`h-6 w-20 rounded ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
                />
              </td>
              <td className="px-4 py-3">
                <div
                  className={`h-4 w-24 rounded ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
                />
              </td>
              <td className="px-4 py-3">
                <div
                  className={`h-6 w-16 rounded ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
                />
              </td>
              <td className="px-4 py-3">
                <div
                  className={`h-8 w-24 rounded ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}