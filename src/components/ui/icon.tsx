import type { LucideIcon } from 'lucide-react';
import type { VariantProps } from 'class-variance-authority';

import * as React from 'react';
import { cva } from 'class-variance-authority';

import { cn } from './utils';

// ----------------------------------------------------------------------

export const iconVariants = cva('', {
  variants: {
    size: {
      sm: 'size-4',
      md: 'size-5',
      xl: 'size-6',
    },
    color: {
      black: 'text-foreground',
      neutral: 'text-muted-foreground',
    },
  },
  defaultVariants: { size: 'sm' },
});

export interface IconProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'color'>,
    VariantProps<typeof iconVariants> {
  icon: LucideIcon;
}

export function Icon({ icon: IconComponent, size, color, className, ...props }: Readonly<IconProps>) {
  return <IconComponent className={cn(iconVariants({ size, color, className }))} {...props} />;
}
