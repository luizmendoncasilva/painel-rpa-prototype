import { CONFIG } from 'src/global-config';

import { UsersView } from 'src/sections/users/view';

// ----------------------------------------------------------------------

const metadata = { title: `Usuários | ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <UsersView />
    </>
  );
}
