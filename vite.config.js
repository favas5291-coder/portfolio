import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pageForPath } from './src/seo/pages.js';
import { renderHead } from './scripts/seo.mjs';

// Production preview uses real static routes rather than an SPA catch-all.
function staticPages() {
  return {
    name: 'forge-static-pages',
    transformIndexHtml: { order: 'pre', handler(html, context) {
      return context.server ? html.replace('<!--page-meta-->', renderHead(pageForPath(context.path), { SITE_ENV: 'preview' })) : html;
    } },
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost');
        const page = pageForPath(url.pathname);
        if (req.method !== 'GET' && req.method !== 'HEAD') { res.statusCode = 405; res.end(); return; }
        if (page.noindex) {
          if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/fonts/') || /\.(png|webp|svg|hdr|txt|xml|woff2)$/.test(url.pathname)) {
            const file = resolve('dist', `.${decodeURIComponent(url.pathname)}`);
            if (file.startsWith(`${resolve('dist')}/`) && (await stat(file).catch(() => null))?.isFile()) return next();
            res.statusCode = 404; res.end('Not found'); return;
          }
          const html = await readFile('dist/404.html', 'utf8').catch(() => 'Not found');
          res.statusCode = 404; res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.setHeader('X-Robots-Tag', 'noindex'); res.end(req.method === 'HEAD' ? undefined : html); return;
        }
        if (url.pathname !== page.path) { res.statusCode = 301; res.setHeader('Location', `${page.path}${url.search}`); res.end(); return; }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [staticPages(), react(), tailwindcss()],
  server: { host: '0.0.0.0', port: 4173, strictPort: true, allowedHosts: ['terminal.local'] },
  preview: { host: '0.0.0.0', port: 4173, allowedHosts: ['terminal.local'] },
  build: { target: 'es2022', sourcemap: false, manifest: true },
});
