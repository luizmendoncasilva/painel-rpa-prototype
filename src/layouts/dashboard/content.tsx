import type { ReactNode } from 'react';

import { paths } from 'src/routes/paths';
import { usePathname } from 'src/routes/hooks';

import { cn } from 'src/components/ui';

// ----------------------------------------------------------------------

interface DashboardContentProps {
  children?: ReactNode;
  className?: string;
  maxWidth?: false | 'md' | 'lg' | 'xl';
}

const MAX_WIDTH: Record<string, string> = {
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-[1600px]',
};

export function DashboardContent({ children, className, maxWidth = 'lg' }: DashboardContentProps) {
  // Entrada em cascata do Cockpit (theme/movimento.css) só no /proposta.
  const cascata = usePathname().startsWith(paths.proposta.root);

  return (
    <div
      data-cascata={cascata ? '' : undefined}
      className={cn(
        'mx-auto flex w-full min-w-0 flex-1 flex-col gap-2 px-4 py-6 sm:px-6 lg:px-8',
        maxWidth && MAX_WIDTH[maxWidth],
        className
      )}
    >
      {children}
    </div>
  );
}
