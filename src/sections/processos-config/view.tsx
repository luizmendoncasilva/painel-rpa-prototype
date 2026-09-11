import type { ProcessoConfig } from 'src/types';

import { toast } from 'sonner';
import { useState } from 'react';
import { Pencil } from 'lucide-react';

import { PROCESSOS } from 'src/assets/data/processos';
import { DashboardContent } from 'src/layouts/dashboard';

import {
  Card,
  Alert,
  Badge,
  Table,
  Tooltip,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  AlertTitle,
  IconButton,
  TableHeader,
  TooltipContent,
  TooltipTrigger,
  AlertDescription,
} from 'src/components/ui';

import { EmpresasElegiveisDialog } from './empresas-elegiveis-dialog';

// ----------------------------------------------------------------------
// Cadastro de processos — tela pedida pelo Guilherme (03/set) para a
// operação manter "empresas elegíveis" por processo sem editar código.
// Ainda não existe CRUD no back-end para isso: a edição abaixo só atualiza
// o estado local da tela, para validar o fluxo antes de implementar a
// persistência de verdade.
// ----------------------------------------------------------------------

export function ProcessosConfigView() {
  const [processos, setProcessos] = useState<ProcessoConfig[]>(PROCESSOS);
  const [editProcesso, setEditProcesso] = useState<ProcessoConfig | null>(null);

  const handleSave = (processoId: string, empresasElegiveis: number) => {
    setProcessos((prev) => prev.map((p) => (p.id === processoId ? { ...p, empresasElegiveis } : p)));
    toast.success('Empresas elegíveis atualizado (apenas nesta tela — ainda não persiste)');
  };

  return (
    <DashboardContent maxWidth="xl">
      <div className="mb-6">
        <h4 className="text-2xl font-semibold">Cadastro de Processos</h4>
        <p className="text-sm text-muted-foreground">
          Glossário dos processos automatizados — nome, motor, praça e quantas empresas são elegíveis hoje.
        </p>
      </div>

      <Alert variant="warning" className="mb-6">
        <AlertTitle>Protótipo — não persiste ainda</AlertTitle>
        <AlertDescription>
          &ldquo;Empresas elegíveis&rdquo; não vem do bhubot: é um número que a operação controla manualmente. Esta tela
          simula a edição só em memória; falta implementar o CRUD real no back-end para gravar de fato.
        </AlertDescription>
      </Alert>

      <Card padding="none">
        <div className="max-h-[640px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Processo</TableHead>
                <TableHead>Motor</TableHead>
                <TableHead>Praça</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead className="text-right">Empresas elegíveis</TableHead>
                <TableHead className="pr-6 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {processos.map((processo) => (
                <TableRow key={processo.id}>
                  <TableCell>
                    <span className="text-sm font-semibold">{processo.nome}</span>
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline">{processo.motor}</Badge>
                  </TableCell>

                  <TableCell className="text-muted-foreground">{processo.praca}</TableCell>

                  <TableCell className="text-muted-foreground">{processo.responsavel}</TableCell>

                  <TableCell className="text-right">
                    <span className="text-sm font-semibold tabular-nums">{processo.empresasElegiveis}</span>
                  </TableCell>

                  <TableCell className="text-right">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <IconButton
                          aria-label="Editar empresas elegíveis"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditProcesso(processo)}
                        >
                          <Pencil className="size-4" />
                        </IconButton>
                      </TooltipTrigger>
                      <TooltipContent>Editar empresas elegíveis</TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <EmpresasElegiveisDialog
        key={editProcesso?.id ?? 'none'}
        open={Boolean(editProcesso)}
        processo={editProcesso}
        onClose={() => setEditProcesso(null)}
        onSave={handleSave}
      />
    </DashboardContent>
  );
}
