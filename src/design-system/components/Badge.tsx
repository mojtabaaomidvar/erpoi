import React from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { cn } from '../../utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  tone?: 'slate' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'violet';
  className?: string;
}

export function Badge({ children, tone = 'slate', className }: BadgeProps) {
  const { theme } = useTheme();
  
  const tones = {
    slate: theme === 'dark'
      ? 'bg-slate-700 text-slate-300 border-slate-600'
      : 'bg-slate-100 text-slate-700 border-slate-200',
    emerald: theme === 'dark'
      ? 'bg-emerald-900/30 text-emerald-300 border-emerald-700'
      : 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: theme === 'dark'
      ? 'bg-amber-900/30 text-amber-300 border-amber-700'
      : 'bg-amber-50 text-amber-700 border-amber-200',
    rose: theme === 'dark'
      ? 'bg-rose-900/30 text-rose-300 border-rose-700'
      : 'bg-rose-50 text-rose-700 border-rose-200',
    indigo: theme === 'dark'
      ? 'bg-indigo-900/30 text-indigo-300 border-indigo-700'
      : 'bg-indigo-50 text-indigo-700 border-indigo-200',
    violet: theme === 'dark'
      ? 'bg-violet-900/30 text-violet-300 border-violet-700'
      : 'bg-violet-50 text-violet-700 border-violet-200',
  };
  
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}