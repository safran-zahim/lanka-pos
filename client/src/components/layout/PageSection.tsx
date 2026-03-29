import type { ReactNode } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface PageSectionProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function PageSection({ title, children, className }: PageSectionProps) {
  return (
    <Card className={cn('overflow-hidden border-border', className)}>
      {title ? (
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
        </CardHeader>
      ) : null}
      <CardContent className="overflow-x-auto">{children}</CardContent>
    </Card>
  );
}
