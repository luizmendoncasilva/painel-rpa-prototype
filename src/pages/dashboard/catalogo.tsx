import { CONFIG } from 'src/global-config';

import { CatalogoView } from 'src/sections/catalogo/view';

// ----------------------------------------------------------------------

const metadata = { title: `Catálogo de RPAs | ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <CatalogoView />
    </>
  );
}
