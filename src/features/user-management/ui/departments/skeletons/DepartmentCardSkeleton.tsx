// src/shared/authorization/ui/user-management/components/skeletons/DepartmentCardSkeleton.tsx

interface DepartmentCardSkeletonProps {
  isDark: boolean;
}

export function DepartmentCardSkeleton({ isDark }: DepartmentCardSkeletonProps) {
  return (
    <div
      className={`rounded-xl border p-4 animate-pulse ${
        isDark
          ? "border-slate-700 bg-slate-800/30"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className={`w-8 h-8 rounded ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
        />
        <div
          className={`h-6 w-32 rounded ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
        />
      </div>
      <div
        className={`h-4 w-24 rounded mb-3 ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
      />
      <div
        className={`h-20 w-full rounded ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
      />
    </div>
  );
}