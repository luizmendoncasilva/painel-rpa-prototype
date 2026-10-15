import type { ProcessoConfig, ProcessoCaseRow } from 'src/types';

import { AlertTriangle } from 'lucide-react';

import { fDateTime } from 'src/utils/format-time';
import { formatCnpj } from 'src/utils/falha-simplificada';

import { COMBO_STATUS_LABEL, COMBO_STATUS_VARIANT } from 'src/assets/data/processos';

import { Badge, Dialog, DialogTitle, DialogHeader, DialogContent, DialogDescription } from 'src/components/ui';

// ----------------------------------------------------------------------
// Detalhe de uma falha para a operação: identifica a empresa e mostra só o
// motivo simplificado. Sem payload, stacktrace ou mensagem técnica — o
// painel é apresentado fora do time de automação.
// ----------------------------------------------------------------------

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="w-[120px] shrink-0 text-sm text-muted-foreground">{label}</span>
      <div className="flex-1 text-sm">{children}</div>
    </div>
  );
}

interface Props {
  caso: ProcessoCaseRow | null;
  processo: ProcessoConfig;
  onClose: () => void;
}

export function FalhaDetailDialog({ caso, processo, onClose }: Props) {
  if (!caso) return null;

  const failedStage = processo.stages.find((s) => caso.stageFailure[s.queue]);
  const failure = failedStage ? caso.stageFailure[failedStage.queue] : null;
  const cnpj = formatCnpj(caso.cnpj);
  // Sem razão social, `empresa` cai no próprio CNPJ — não repetir.
  const razaoSocial = caso.empresa !== caso.cnpj && caso.empresa !== 'Empresa não identificada' ? caso.empresa : null;

  return (
    <Dialog open={Boolean(caso)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge variant={COMBO_STATUS_VARIANT[caso.comboStatus]} className="text-[11px]">
              {COMBO_STATUS_LABEL[caso.comboStatus]}
            </Badge>
            <DialogTitle className="truncate">{razaoSocial ?? cnpj ?? 'Empresa não identificada'}</DialogTitle>
          </div>
          <DialogDescription>{processo.nome}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Empresa</span>
            <InfoRow label="Razão social">{razaoSocial ?? <span className="text-muted-foreground">Não informada</span>}</InfoRow>
            <InfoRow label="CNPJ">{cnpj ?? <span className="text-muted-foreground">—</span>}</InfoRow>
            <InfoRow label="Competência">{caso.competencia ?? '—'}</InfoRow>
            {caso.base && <InfoRow label="Base">{caso.base}</InfoRow>}
            <InfoRow label="Data / hora">{fDateTime(caso.updatedAt)}</InfoRow>
            {failedStage && processo.stages.length > 1 && <InfoRow label="Etapa">{failedStage.label}</InfoRow>}
            {failure && (
              <InfoRow label="Tentativas">
                {failure.tentativas} de {failure.maxTentativas}
              </InfoRow>
            )}
          </div>

          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-destructive">
                  {failure?.categoria ?? 'Falha técnica no robô'}
                </span>
                <span className="text-sm text-foreground/80">
                  {failure?.orientacao ?? 'Caso em análise pela equipe de automação.'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
