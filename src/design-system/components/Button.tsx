import React from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  className, 
  children, 
  ...props 
}: ButtonProps) {
  const { theme } = useTheme();
  
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
    secondary: theme === 'dark' 
      ? 'bg-slate-700 text-white hover:bg-slate-600 focus:ring-slate-500'
      : 'bg-slate-200 text-slate-900 hover:bg-slate-300 focus:ring-slate-400',
    outline: theme === 'dark'
      ? 'border border-slate-600 text-slate-300 hover:bg-slate-800 focus:ring-slate-500'
      : 'border border-slate-300 text-slate-700 hover:bg-slate-50 focus:ring-slate-400',
    ghost: theme === 'dark'
      ? 'text-slate-300 hover:bg-slate-800 focus:ring-slate-500'
      : 'text-slate-700 hover:bg-slate-100 focus:ring-slate-400',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}