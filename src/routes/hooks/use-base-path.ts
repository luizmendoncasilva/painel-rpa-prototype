import { paths } from '../paths';
import { usePathname } from './use-pathname';

// ----------------------------------------------------------------------

/**
 * Raiz das telas do painel na rota atual: '/proposta' (chassi do Cockpit) ou
 * '/dashboard' (layout original). Links internos entre telas usam isto para
 * não pular de um design para o outro.
 */
export function useBasePath() {
  const pathname = usePathname();
  return pathname.startsWith(paths.proposta.root) ? paths.proposta.root : paths.dashboard.root;
}
