import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface PageShellProps {
  children: ReactNode;
  className?: string;
}

export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className="min-h-full w-full bg-gradient-to-b from-slate-50 via-white to-slate-50 px-3 py-3 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 sm:px-6 sm:py-6">
      <div className={cn('mx-auto w-full max-w-[1400px] space-y-4 sm:space-y-6', className)}>{children}</div>
    </div>
  );
}
