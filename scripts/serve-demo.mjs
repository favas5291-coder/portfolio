import { readFile, stat } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.woff': 'font/woff', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8' };

// Serve each standalone demo from its own asset directory.
export function serveDemo(directory, slug) {
  const prefix = `/demos/${slug}/`;
  const root = resolve(directory, 'demos', slug);
  return async (req, res, next) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === prefix.slice(0, -1)) {
      res.statusCode = 301; res.setHeader('Location', prefix + url.search); res.end(); return;
    }
    if (!url.pathname.startsWith(prefix)) return next();
    if (!['GET', 'HEAD'].includes(req.method)) { res.statusCode = 405; res.end(); return; }
    let path;
    try { path = decodeURIComponent(url.pathname).slice(prefix.length); }
    catch { res.statusCode = 400; res.end('Invalid URL'); return; }
    const file = resolve(root, path || 'index.html');
    if (!file.startsWith(root + sep) || !(await stat(file).catch(() => null))?.isFile()) {
      res.statusCode = 404; res.end('Not found'); return;
    }
    res.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.end(req.method === 'HEAD' ? undefined : await readFile(file));
  };
}

export const serveLuxvibe = directory => serveDemo(directory, "luxvibe");
