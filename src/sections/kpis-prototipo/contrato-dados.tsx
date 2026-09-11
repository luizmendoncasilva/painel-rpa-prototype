import { Card, CardContent } from 'src/components/ui';

// ----------------------------------------------------------------------
// Especificação técnica — o que o back-end precisa gravar por execução
// para o Painel conseguir montar tudo acima (trilha, sucesso parcial,
// categoria de falha). É o resumo da padronização de logs discutida com
// o Danilo e o Guilherme na call de alinhamento.
// ----------------------------------------------------------------------

// Exemplo HIPOTÉTICO de processo com 2+ bots em sequência — capacidade que o
// schema já suporta, mas que hoje não existe em nenhuma fila real (confirmado
// pelo Guilherme com o Danilo: cada bot conclui um processo individual). Um
// processo de 1 bot só (o caso de todos hoje) manda "etapas" com 1 item.
const PAYLOAD_EXAMPLE = `// 1 registro = 1 processo rodado para 1 CNPJ em 1 competência
{
  "execucao_id": "exe_2026-07_exemplo_0412",
  "processo":    { "id": "exemplo-hipotetico", "nome": "Processo hipotético com 2 bots", "motor": "Fiscal" },
  "cliente":     { "cnpj": "41.207.336/0001-84", "razao_social": "…", "base": "Base 3" },
  "competencia": "2026-07",
  "status":       "falha",        // sucesso | falha | pendente — derivado das etapas
  "iniciado_em":  "2026-08-07T10:41:00-03:00",
  "duracao_seg":  742,
  "origem":       "agendado",     // agendado | manual | reprocessamento
  "etapas": [
    { "ordem": 1, "bot": "BOT-11", "nome": "Primeira etapa do processo", "status": "sucesso", "duracao_seg": 61 },
    { "ordem": 2, "bot": "BOT-12", "nome": "Segunda etapa do processo", "status": "falha",
      "categoria": "Inscrição municipal inválida",
      "mensagem":  "CCM não localizado para o CNPJ informado",
      "tratativa": "humana", "chamado": "FIS-1042" }
  ],
  "evidencia_url": "…"          // print/PDF que a operação confere
}`;

const REGRAS = [
  <>
    <b>status</b> do processo = <code>falha</code> se qualquer etapa falhou; <code>pendente</code> se nenhuma falhou
    e alguma não terminou; senão <code>sucesso</code>.
  </>,
  'Etapa depois da que falhou entra como nao_executado — não como falha (senão a contagem duplica).',
  <>
    <b>duracao_seg</b> do processo = soma das etapas, e alimenta o &quot;tempo de robô&quot;.
  </>,
  <>
    <b>categoria</b> só existe em etapa com falha, e vem de lista fechada por bot.
  </>,
];

const FORA_ESCOPO = [
  'Valor da guia — a operação confere pela evidência, não pelo número.',
  'Dados do prestador (o processo é do tomador; prestador repetido não diz nada sobre o cliente).',
  'Campos específicos de um único processo — vão só no Excel exportado.',
  'Log bruto do bot — fica no Datadog/S3, o painel só linka.',
];

export function ContratoDados() {
  return (
    <Card className="border-none bg-foreground text-background">
      <CardContent className="flex flex-col gap-5">
        <div>
          <h3 className="mb-1 text-sm font-semibold">Payload por execução de processo</h3>
          <p className="max-w-3xl text-sm text-background/70">
            Um registro por processo executado por cliente/competência. As etapas são o array — é daí que sai a
            trilha e o &quot;onde quebrou&quot;. Exemplo abaixo com 2 etapas é hipotético: hoje todo processo tem 1
            bot só, mas o schema já suporta mais quando surgir um caso real.
          </p>
        </div>

        <pre className="overflow-x-auto rounded-md border border-background/15 bg-background/5 p-4 font-mono text-[12px] leading-relaxed text-background/90">
          {PAYLOAD_EXAMPLE}
        </pre>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-md border-l-2 border-l-success bg-background/5 p-4">
            <h4 className="mb-2 text-sm font-semibold">Regras de derivação</h4>
            <ul className="flex flex-col gap-1.5 text-xs text-background/75">
              {REGRAS.map((regra, idx) => (
                <li key={idx} className="list-disc pl-0.5 marker:text-background/40">
                  {regra}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-md border-l-2 border-l-destructive bg-background/5 p-4">
            <h4 className="mb-2 text-sm font-semibold">Fora do escopo deste painel</h4>
            <ul className="flex flex-col gap-1.5 text-xs text-background/75">
              {FORA_ESCOPO.map((item) => (
                <li key={item} className="list-disc pl-0.5 marker:text-background/40">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
