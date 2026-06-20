import React from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { cn } from '../../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, className, padding = 'md' }: CardProps) {
  const { theme } = useTheme();
  
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };
  
  return (
    <div
      className={cn(
        'rounded-xl border shadow-sm',
        paddings[padding],
        theme === 'dark'
          ? 'bg-slate-900 border-slate-700'
          : 'bg-white border-slate-200',
        className
      )}
    >
      {children}
    </div>
  );
}