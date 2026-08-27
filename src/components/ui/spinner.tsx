import type { VariantProps } from 'class-variance-authority';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cva } from 'class-variance-authority';

import { cn } from './utils';

// ----------------------------------------------------------------------

export const spinnerVariants = cva('animate-spin text-current', {
  variants: {
    size: {
      xs: 'size-3',
      sm: 'size-3.5',
      default: 'size-4',
      lg: 'size-5',
      xl: 'size-6',
    },
  },
  defaultVariants: { size: 'default' },
});

export interface SpinnerProps
  extends React.SVGAttributes<SVGSVGElement>,
    VariantProps<typeof spinnerVariants> {}

export function Spinner({ className, size, ...props }: SpinnerProps) {
  return <Loader2 className={cn(spinnerVariants({ size, className }))} {...props} />;
}
