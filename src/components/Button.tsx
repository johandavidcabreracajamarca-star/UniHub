import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: ReactNode;
}

const variants: Record<string, string> = {
  primary: 'bg-primary text-white hover:bg-primary-dark hover:shadow-card-hover active:scale-[0.96]',
  secondary: 'bg-secondary text-white hover:bg-secondary/90 hover:shadow-card-hover active:scale-[0.96]',
  outline: 'border border-ink/15 text-ink bg-white hover:bg-ink/5 active:scale-[0.96]',
  ghost: 'text-ink hover:bg-ink/5 active:scale-[0.96]',
  danger: 'bg-red-50 text-red-600 hover:bg-red-100 active:scale-[0.96]',
};

const sizes: Record<string, string> = {
  sm: 'text-sm px-3 py-1.5 min-h-[36px]',
  md: 'text-sm px-4 py-2.5 min-h-[44px]',
  lg: 'text-base px-5 py-3.5 min-h-[52px]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  icon,
  disabled,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-control font-medium transition-all duration-150 ease-out disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}
