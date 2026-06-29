import { cn } from"@shared/lib/cn";

export interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, action, className }: CardHeaderProps) {
  return (
    <div className={cn("mb-4 flex items-start justify-between", className)}>
      <div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
          {title}
        </h3>
        {subtitle && (
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}




