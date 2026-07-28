import type { HTMLAttributes, ReactNode } from 'react';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  strong?: boolean;
}

export function GlassCard({ children, strong = false, className = '', ...rest }: GlassCardProps) {
  return (
    <div className={`${strong ? 'glass-panel-strong' : 'glass-panel'} ${className}`} {...rest}>
      {children}
    </div>
  );
}
