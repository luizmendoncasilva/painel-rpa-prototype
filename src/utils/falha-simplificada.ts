// ----------------------------------------------------------------------
// Tradução de erro técnico → motivo simples para a operação.
//
// Painel e relatórios são apresentados à operação, então nunca exibem o
// erro cru do robô (stacktrace, payload, URLs internas, usuário/senha que
// às vezes vazam na mensagem). Só sai daqui um motivo de lista fechada e
// uma orientação do que fazer.
// ----------------------------------------------------------------------

export interface FalhaSimplificada {
  motivo: string;
  orientacao: string;
}

interface Regra extends FalhaSimplificada {
  teste: RegExp;
}

const REGRAS: Regra[] = [
  {
    teste: /certificad|certificate|\.pfx|e-?cnpj/i,
    motivo: 'Empresa não possui certificado digital vigente',
    orientacao: 'Solicitar ao cliente a renovação ou o envio do certificado digital válido.',
  },
  {
    teste: /credencia|senha|password|login|401|403|unauthori|forbidden|acesso negado/i,
    motivo: 'Credencial de acesso inválida ou alterada',
    orientacao: 'Confirmar com o cliente o usuário e a senha atuais do portal e atualizar o cadastro.',
  },
  {
    teste: /inscri[cç][aã]o municipal|\bccm\b|\bim\b/i,
    motivo: 'Inscrição municipal não localizada',
    orientacao: 'Verificar se o CNPJ possui inscrição municipal ativa na prefeitura.',
  },
  {
    teste: /compet[eê]ncia.*encerrad|guia recusad|recusou/i,
    motivo: 'Guia recusada pelo portal',
    orientacao: 'Verificar se a competência já foi encerrada ou se a guia já foi emitida manualmente.',
  },
  {
    teste: /sess[aã]o (expirad|encerrad)|session expired/i,
    motivo: 'Sessão do portal expirou durante a execução',
    orientacao: 'Nenhuma ação do cliente — o caso pode ser reprocessado.',
  },
  {
    teste: /loja n[aã]o (encontrad|localizad)/i,
    motivo: 'Loja não localizada no cadastro',
    orientacao: 'Conferir o cadastro de lojas da empresa.',
  },
  {
    teste: /fora do ar|indispon|\b50[234]\b|timeout|timed out|tempo esgotado|n[aã]o respondeu/i,
    motivo: 'Portal indisponível no momento da execução',
    orientacao: 'Nenhuma ação do cliente — o caso pode ser reprocessado quando o portal normalizar.',
  },
  {
    teste: /captcha/i,
    motivo: 'Portal exigiu verificação manual (captcha)',
    orientacao: 'Encaminhar para emissão manual ou reprocessar mais tarde.',
  },
];

const FALLBACK: FalhaSimplificada = {
  motivo: 'Falha técnica no robô',
  orientacao: 'Caso em análise pela equipe de automação.',
};

/**
 * Recebe a categoria (lista fechada, quando o bot envia) e/ou a mensagem
 * técnica e devolve só o motivo simplificado. O texto técnico nunca é
 * repassado.
 */
export function simplificarFalha(categoria?: string | null, mensagemTecnica?: string | null): FalhaSimplificada {
  const texto = [categoria, mensagemTecnica].filter(Boolean).join(' ');
  const regra = REGRAS.find((r) => r.teste.test(texto));
  if (regra) return { motivo: regra.motivo, orientacao: regra.orientacao };
  return FALLBACK;
}

export function formatCnpj(cnpj: string | null | undefined): string | null {
  if (!cnpj) return null;
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}
