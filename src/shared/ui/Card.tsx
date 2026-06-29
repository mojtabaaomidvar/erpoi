import { cn } from"../lib/cn";

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?:"none"|"sm"|"md"|"lg";
}

export function Card({ children, className, padding ="md"}: CardProps) {
  const paddingClass = {
    none:"",
    sm:"p-3",
    md:"p-5",
    lg:"p-7",
  }[padding];

  return (
    <div
      className={cn("rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900",
        paddingClass,
        className
      )}
    >
      {children}
    </div>
  );
}





