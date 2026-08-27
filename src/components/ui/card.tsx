import * as React from 'react';

import { cn } from './utils';

// ----------------------------------------------------------------------

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

const CardPaddingContext = React.createContext<CardPadding>('md');

const CARD_PY: Record<CardPadding, string> = {
  none: '',
  sm: 'py-3',
  md: 'py-6',
  lg: 'py-8',
};

const CARD_PX: Record<CardPadding, string> = {
  none: '',
  sm: 'px-3',
  md: 'px-6',
  lg: 'px-8',
};

export interface CardProps extends React.ComponentProps<'div'> {
  padding?: CardPadding;
}

export function Card({ className, padding = 'md', ...props }: Readonly<CardProps>) {
  return (
    <CardPaddingContext.Provider value={padding}>
      <div
        data-slot="card"
        className={cn(
          'flex flex-col gap-6 rounded-lg border border-border bg-card text-card-foreground shadow-xs',
          CARD_PY[padding],
          className
        )}
        {...props}
      />
    </CardPaddingContext.Provider>
  );
}

export function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  const padding = React.useContext(CardPaddingContext);
  return (
    <div data-slot="card-header" className={cn('flex flex-col gap-1.5', CARD_PX[padding], className)} {...props} />
  );
}

export function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot="card-title" className={cn('font-semibold leading-none', className)} {...props} />
  );
}

export function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot="card-description" className={cn('text-sm text-muted-foreground', className)} {...props} />
  );
}

export function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-action" className={cn('ml-auto', className)} {...props} />;
}

export function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  const padding = React.useContext(CardPaddingContext);
  return <div data-slot="card-content" className={cn(CARD_PX[padding], className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  const padding = React.useContext(CardPaddingContext);
  return (
    <div data-slot="card-footer" className={cn('flex items-center', CARD_PX[padding], className)} {...props} />
  );
}
