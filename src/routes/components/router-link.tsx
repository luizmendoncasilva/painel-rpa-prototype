import type { Ref } from 'react';
import type { LinkProps } from 'react-router';

import { Link } from 'react-router';

// ----------------------------------------------------------------------

interface RouterLinkProps extends Omit<LinkProps, 'to'> {
  href: string;
  ref?: Ref<HTMLAnchorElement>;
}

export function RouterLink({ href, ref, ...other }: RouterLinkProps) {
  return <Link ref={ref} to={href} {...other} />;
}
