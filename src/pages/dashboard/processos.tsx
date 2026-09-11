import { CONFIG } from 'src/global-config';

import { ProcessosConfigView } from 'src/sections/processos-config/view';

// ----------------------------------------------------------------------

const metadata = { title: `Cadastro de Processos | ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <ProcessosConfigView />
    </>
  );
}
