import { CONFIG } from 'src/global-config';

import { KpisPrototipoView } from 'src/sections/kpis-prototipo/view';

// ----------------------------------------------------------------------

const metadata = { title: `Analytics | ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <KpisPrototipoView />
    </>
  );
}
