// Package a review-only copy that also works when opened from file://.
import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';

const root = resolve('.');
const bundle = await build({
  bundle: true, minify: true, write: false, format: 'iife', jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env': '{}' },
  stdin: { loader: 'jsx', resolveDir: root, contents: `
    import { createRoot } from 'react-dom/client';
    import App from './src/App.jsx';
    import MarketingPages from './src/MarketingPages.jsx';
    import ContactPage from './src/fit/ContactPage.jsx';
    import { pageForPath } from './src/seo/pages.js';

    // Ordinary navigations retain Back, reload, fragments and the enquiry selection.
    document.addEventListener('click', event => {
      const anchor = event.target.closest('a[href]');
      const href = anchor?.getAttribute('href');
      if (!href?.startsWith('/') || href.startsWith('//')) return;
      const route = new URL(href, 'https://fazhere.com');
      const destination = new URL(location.href);
      destination.search = route.search;
      if (route.pathname !== '/') destination.searchParams.set('reviewPath', route.pathname);
      destination.hash = route.hash;
      anchor.href = destination.href;
    }, true);
    const route = new URLSearchParams(location.search).get('reviewPath') || '/';
    const page = pageForPath(route);
    createRoot(document.getElementById('root')).render(route === '/' ? <App/> : page.path === '/contact/' ? <ContactPage/> : <MarketingPages page={page}/>);
  ` },
  plugins: [{name: 'use-production-styles', setup(builder) {
    builder.onLoad({filter: /\.css$/}, () => ({contents: '', loader: 'js'}));
  }}],
});
const home = await readFile('dist/index.html', 'utf8');
const marketing = await readFile('dist/projects/gymdrobe/index.html', 'utf8');
const contact = await readFile('dist/contact/index.html', 'utf8');
const stylePaths = new Set([...(home + marketing + contact).matchAll(/<link\b[^>]*href="(\/[^"]+\.css)"[^>]*>/g)].map(match => match[1]));
const styles = await Promise.all([...stylePaths].map(file => readFile(join(root, 'dist', file), 'utf8')));
const types = {'.webp':'image/webp', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.mp3':'audio/mpeg', '.ogg':'audio/ogg'};
const dataURIs = new Map();
async function embed(text) {
  // Only rooted local assets can match. External links and embedded shaders stay untouched.
  const files = new Set([...text.matchAll(/(?:["'(])(\/[a-zA-Z0-9_./-]+\.(?:webp|png|jpg|svg|woff2|mp3|ogg))(?=["')])/g)].map(match => match[1]));
  for (const file of files) {
    if (!dataURIs.has(file)) dataURIs.set(file, 'data:' + types[extname(file)] + ';base64,' + (await readFile(join(root, 'dist', file))).toString('base64'));
    text = text.replaceAll(file, dataURIs.get(file));
  }
  return text;
}
const html = '<!doctype html><html lang="en-IN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Fazhere · Built to Fit review</title><style>' +
  (await embed(styles.join('\n'))).replace(/@import\s+[^;]*;/g,'') +
  '</style></head><body><div id="root"></div><script>' +
  (await embed(bundle.outputFiles[0].text)).replace(/<\/script/gi,'<\\/script') + '</script></body></html>';
const output = resolve(process.argv[2] || 'visual-checks/Fazhere-Built-to-Fit-Preview.html');
await mkdir(dirname(output), {recursive: true});
await writeFile(output, html);
console.log('Standalone review:', output, '(' + Buffer.byteLength(html) + ' bytes)');
