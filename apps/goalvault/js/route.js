// Hash routes: #/overview, #/categories, #/category/{id}, #/archive.
export function parseRoute(hash) {
  const [name, id] = String(hash ?? '').replace(/^#\/?/, '').split('/');
  if (name === 'categories') return { name: 'categories' };
  if (name === 'category' && id) return { name: 'category', id: decodeURIComponent(id) };
  if (name === 'archive') return { name: 'archive' };
  return { name: 'overview' };
}

export function routeHref(name, id) {
  return id ? `#/${name}/${encodeURIComponent(id)}` : `#/${name}`;
}
