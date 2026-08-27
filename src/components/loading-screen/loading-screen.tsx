import { Spinner } from 'src/components/ui';

// ----------------------------------------------------------------------

export function LoadingScreen() {
  return (
    <div className="flex min-h-full w-full flex-1 items-center justify-center py-20">
      <Spinner size="xl" className="text-muted-foreground" />
    </div>
  );
}
