import { CONFIG } from 'src/global-config';

import { EspecificacaoView } from 'src/sections/especificacao/view';

// ----------------------------------------------------------------------

const metadata = { title: `Especificação técnica | ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <EspecificacaoView />
    </>
  );
}
