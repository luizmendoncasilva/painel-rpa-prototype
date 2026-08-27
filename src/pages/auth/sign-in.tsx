import { CONFIG } from 'src/global-config';

import { SignInView } from 'src/sections/auth/sign-in-view';

// ----------------------------------------------------------------------

const metadata = { title: `Entrar | ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <SignInView />
    </>
  );
}
