import type { VariantProps } from 'class-variance-authority';

import * as React from 'react';
import { Slot } from 'radix-ui';
import { cva } from 'class-variance-authority';

import { cn } from './utils';
import { Spinner } from './spinner';

// ----------------------------------------------------------------------

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 outline-none focus-visible:ring-2 focus-visible:ring-ring",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90',
        success: 'bg-success text-success-foreground shadow-xs hover:bg-success/90',
        warning: 'bg-warning text-warning-foreground shadow-xs hover:bg-warning/90',
        info: 'bg-info text-info-foreground shadow-xs hover:bg-info/90',
        secondary: 'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
        outline: 'border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-9 px-4 py-2',
        lg: 'h-10 px-6',
        sm: 'h-8 gap-1.5 px-3',
        xs: 'h-7 gap-1 px-2 text-xs',
        icon: 'size-9',
        'icon-lg': 'size-10',
        'icon-sm': 'size-8',
        'icon-xs': 'size-7',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot.Slot : 'button';
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
    );
  }
);
Button.displayName = 'Button';

// ----------------------------------------------------------------------

type IconButtonSize = 'xs' | 'sm' | 'default' | 'lg';

export interface IconButtonProps extends Omit<ButtonProps, 'size'> {
  'aria-label': string;
  size?: IconButtonSize;
}

const ICON_BUTTON_SIZE_MAP: Record<IconButtonSize, VariantProps<typeof buttonVariants>['size']> = {
  xs: 'icon-xs',
  sm: 'icon-sm',
  default: 'icon',
  lg: 'icon-lg',
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ size = 'default', ...props }, ref) => (
    <Button ref={ref} size={ICON_BUTTON_SIZE_MAP[size]} {...props} />
  )
);
IconButton.displayName = 'IconButton';

// ----------------------------------------------------------------------

export interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
}

export const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ loading, loadingText, disabled, children, ...props }, ref) => (
    <Button ref={ref} disabled={disabled || loading} {...props}>
      {loading && <Spinner className="size-4" />}
      {loading && loadingText ? loadingText : children}
    </Button>
  )
);
LoadingButton.displayName = 'LoadingButton';
