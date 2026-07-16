export const toCanonicalPath = (path: string) => {
  if (!path || path === '/' || path.startsWith('#') || /^[a-z][a-z\d+.-]*:/i.test(path)) {
    return path;
  }

  const [pathAndSearch, hash = ''] = path.split('#', 2);
  const [pathname, search = ''] = pathAndSearch.split('?', 2);
  const normalizedPath = pathname === '/' ? '/' : `${pathname.replace(/\/+$/, '')}/`;

  return `${normalizedPath}${search ? `?${search}` : ''}${hash ? `#${hash}` : ''}`;
};

export const toolPath = (slug: string) => toCanonicalPath(slug);
