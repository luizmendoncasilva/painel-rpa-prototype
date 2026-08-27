import type { Task } from 'src/types';

import { useMemo } from 'react';

import { Card, CardTitle, CardHeader, CardContent, CardDescription } from 'src/components/ui';

// ----------------------------------------------------------------------
// Ranking de categorias de falha — só faz sentido com categoria fechada
// (não texto livre), exatamente o padrão de log pedido na call para
// decidir o que vira debug de bot e o que vira chamado para a operação.
// ----------------------------------------------------------------------

interface Props {
  tasks: Task[];
  queues: string[];
}

interface CategoryCount {
  categoria: string;
  count: number;
  exemploChamado: string;
}

export function NaoConformidades({ tasks, queues }: Props) {
  const ranking = useMemo<CategoryCount[]>(() => {
    const byCategoria = new Map<string, CategoryCount>();

    for (const task of tasks) {
      if (task.status !== 'FAILED' || !queues.includes(task.queue)) continue;
      const categoria = task.error_payload?.categoria as string | undefined;
      if (!categoria) continue;

      const existing = byCategoria.get(categoria);
      if (existing) {
        existing.count += 1;
      } else {
        byCategoria.set(categoria, {
          categoria,
          count: 1,
          exemploChamado: (task.error_payload?.chamado as string | undefined) ?? '',
        });
      }
    }

    return [...byCategoria.values()].sort((a, b) => b.count - a.count);
  }, [tasks, queues]);

  const top = ranking.slice(0, 8);
  const resto = ranking.slice(8).reduce((sum, r) => sum + r.count, 0);
  const max = top.length > 0 ? top[0].count : 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Não conformidades</CardTitle>
        <CardDescription>
          Falhas agrupadas por categoria — o que define se o caso vira debug do bot ou tratativa humana.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {top.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma falha categorizada no período.</p>
        ) : (
          top.map((r) => (
            <div key={r.categoria} className="grid grid-cols-[minmax(140px,240px)_1fr_36px] items-center gap-3">
              <span className="truncate text-sm font-medium">{r.categoria}</span>
              <span className="h-2.5 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full bg-destructive"
                  style={{ width: `${(r.count / max) * 100}%` }}
                />
              </span>
              <span className="text-right font-mono text-sm font-semibold">{r.count}</span>
            </div>
          ))
        )}

        {resto > 0 && (
          <p className="pt-1 text-xs text-muted-foreground">
            + {resto} falhas em {ranking.length - top.length} outras categorias.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
