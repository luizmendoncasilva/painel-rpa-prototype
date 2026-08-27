import { Button } from '@bhubai/bhub-design-system';

import { RouterLink } from 'src/routes/components';

import { SimpleLayout } from 'src/layouts/simple';

// ----------------------------------------------------------------------

export function NotFoundView() {
  return (
    <SimpleLayout>
      <div className="mx-auto max-w-md">
        <h3 className="mb-2 text-2xl font-semibold text-foreground">Página não encontrada</h3>

        <p className="mb-6 text-sm text-muted-foreground">
          A página que você está procurando não existe ou foi removida.
        </p>

        <Button asChild size="lg">
          <RouterLink href="/">Voltar ao início</RouterLink>
        </Button>
      </div>
    </SimpleLayout>
  );
}
