import { ArrowLeft } from 'lucide-react';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { DashboardContent } from 'src/layouts/dashboard';

import { Button } from 'src/components/ui';

import { ContratoDados } from 'src/sections/kpis-prototipo/contrato-dados';

// ----------------------------------------------------------------------
// Documentação técnica para o time de engenharia — fora do fluxo de
// leitura do stakeholder (antes ficava embutida no Painel, competindo
// por atenção com os indicadores de negócio).
// ----------------------------------------------------------------------

export function EspecificacaoView() {
  return (
    <DashboardContent maxWidth="xl">
      <Button variant="ghost" size="sm" className="mb-3 -ml-2 gap-1.5 text-muted-foreground" asChild>
        <RouterLink href={paths.dashboard.painel}>
          <ArrowLeft className="size-4" />
          Voltar ao Painel
        </RouterLink>
      </Button>

      <div className="mb-6">
        <h4 className="text-2xl font-semibold">Especificação técnica</h4>
        <p className="text-sm text-muted-foreground">
          O que o back-end precisa enviar por execução para o Painel conseguir montar trilha, sucesso parcial e
          categoria de falha. Referência para o time de engenharia — não faz parte do acompanhamento de negócio.
        </p>
      </div>

      <ContratoDados />
    </DashboardContent>
  );
}
