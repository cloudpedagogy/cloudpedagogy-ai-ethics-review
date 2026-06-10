import type { ButtonHTMLAttributes } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-white',
        {
          'bg-slate-900 text-white hover:bg-slate-800': variant === 'primary',
          'border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900': variant === 'secondary',
          'bg-red-600 text-white hover:bg-red-700': variant === 'danger',
          'hover:bg-slate-100 hover:text-slate-900': variant === 'ghost',
          'h-8 px-3 text-xs': size === 'sm',
          'h-10 py-2 px-4 text-sm': size === 'md',
          'h-11 px-8 text-base': size === 'lg',
        },
        className
      )}
      {...props}
    />
  );
}
