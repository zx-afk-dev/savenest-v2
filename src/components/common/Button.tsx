import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  loading = false,
  className = '',
  disabled,
  ...rest
}: ButtonProps) {
  const base = variant === 'primary' ? 'btn-primary' : 'btn-secondary';
  return (
    <button className={`${base} ${className}`} disabled={disabled || loading} {...rest}>
      {loading && (
        <svg
          className="h-4 w-4 animate-spin motion-reduce:animate-none"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            strokeWidth="3"
            className="opacity-25"
          />
          <path
            d="M21 12a9 9 0 0 0-9-9"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            className="opacity-90"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
