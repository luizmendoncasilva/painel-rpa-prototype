import type { ReactNode } from 'react';

import { Logo } from 'src/components/logo';

// ----------------------------------------------------------------------

export function SimpleLayout({ children }: { children?: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="flex h-16 items-center px-4 sm:px-6">
        <Logo />
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center">
        {children}
      </main>
    </div>
  );
}
