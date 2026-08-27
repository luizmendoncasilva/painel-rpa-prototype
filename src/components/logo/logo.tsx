import { cn } from '@bhubai/bhub-design-system';

import { RouterLink } from 'src/routes/components';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

export interface LogoProps {
  href?: string;
  disabled?: boolean;
  isSingle?: boolean;
  className?: string;
}

export function Logo({ href = '/', disabled, isSingle = true, className }: LogoProps) {
  return (
    <RouterLink
      href={href}
      aria-label="Logo"
      className={cn(
        'inline-flex shrink-0 items-center',
        isSingle ? 'size-10' : 'h-9 w-[102px]',
        disabled && 'pointer-events-none',
        className
      )}
    >
      <img
        alt={isSingle ? 'Single logo' : 'Full logo'}
        src={`${CONFIG.assetsDir}/logo/${isSingle ? 'logo-single' : 'logo-full'}.png`}
        className="h-full w-full object-contain"
      />
    </RouterLink>
  );
}
