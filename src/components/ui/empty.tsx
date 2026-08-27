import * as React from 'react';
import { Inbox } from 'lucide-react';

import { cn } from './utils';

// ----------------------------------------------------------------------

export interface EmptyProps extends React.ComponentProps<'div'> {
  icon?: React.ReactNode | null;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function Empty({ className, icon, title, description, action, ...props }: EmptyProps) {
  return (
    <div
      data-slot="empty"
      className={cn('flex flex-col items-center gap-3 py-10 text-center', className)}
      {...props}
    >
      {icon !== null && (
        <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground [&_svg]:size-5">
          {icon ?? <Inbox />}
        </div>
      )}
      {title && <p className="text-sm font-medium text-foreground">{title}</p>}
      {description && <p className="max-w-72 text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}
