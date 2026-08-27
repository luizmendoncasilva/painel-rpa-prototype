import type { VariantProps } from 'class-variance-authority';

import * as React from 'react';
import { cva } from 'class-variance-authority';

import { cn } from './utils';

// ----------------------------------------------------------------------

export const alertVariants = cva(
  'relative grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 rounded-lg border px-4 py-3 text-sm has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] has-[>svg]:gap-x-3 [&>svg]:size-4 [&>svg]:translate-y-0.5',
  {
    variants: {
      variant: {
        default: 'border-border bg-card text-card-foreground',
        destructive: 'border-destructive/30 bg-destructive/5 text-destructive [&>svg]:text-destructive',
        success: 'border-success-border/30 bg-success-subtle text-success-text [&>svg]:text-success-text',
        warning: 'border-warning-border/30 bg-warning-subtle text-warning-text [&>svg]:text-warning-text',
        info: 'border-info-border/30 bg-info-subtle text-info-text [&>svg]:text-info-text',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return <div data-slot="alert" role="alert" className={cn(alertVariants({ variant }), className)} {...props} />;
}

export function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-title"
      className={cn('col-start-2 min-h-4 font-medium leading-none tracking-tight', className)}
      {...props}
    />
  );
}

export function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={cn('col-start-2 grid justify-items-start gap-1 text-sm text-current/90 [&_p]:leading-relaxed', className)}
      {...props}
    />
  );
}
