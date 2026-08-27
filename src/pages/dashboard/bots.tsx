import { CONFIG } from 'src/global-config';

import { BotsView } from 'src/sections/bots/view';

const metadata = { title: `Bots | ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <BotsView />
    </>
  );
}
