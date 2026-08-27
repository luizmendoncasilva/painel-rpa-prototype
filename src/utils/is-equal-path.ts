function removeLastSlash(path: string): string {
  return path !== '/' && path.endsWith('/') ? path.slice(0, -1) : path;
}

/** Compares just the pathname of two URLs (relative or absolute), ignoring query/hash. */
export function isEqualPath(path1: string, path2: string): boolean {
  try {
    const { pathname: p1 } = new URL(path1.trim(), 'http://dummy');
    const { pathname: p2 } = new URL(path2.trim(), 'http://dummy');
    return removeLastSlash(p1) === removeLastSlash(p2);
  } catch {
    return false;
  }
}
