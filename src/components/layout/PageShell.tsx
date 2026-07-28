import type { ReactNode } from 'react';

interface PageShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function PageShell({ title, subtitle, children }: PageShellProps) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:py-20">
      <header className="mb-10 text-center">
        <h1 className="font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-3 text-ink-800/70">{subtitle}</p>}
      </header>

      <div className="glass-panel space-y-6 p-6 leading-relaxed text-ink-800/80 sm:p-10 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink-900 [&_h2]:mt-2 [&_p]:text-sm [&_li]:text-sm sm:[&_p]:text-base sm:[&_li]:text-base [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </div>
  );
}
