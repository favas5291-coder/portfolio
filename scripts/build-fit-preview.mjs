// Package the production room views, finishes and page styles in one file:// review.
import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';

const root = resolve('.');
const dist = join(root, 'dist');
const output = resolve(process.argv[2] || 'visual-checks/Fazhere-Studio-Preview.html');
const mediaTypes = {
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg',
};
const assets = new Map();
const assetPattern = /(["'(])(\/[a-zA-Z0-9_./-]+\.(?:webp|png|jpe?g|svg|woff2?|mp3|ogg))(?=["')])/g;
async function embed(text) {
  const paths = new Set([...text.matchAll(assetPattern)].map(match => match[2]));
  await Promise.all([...paths].filter(path => !assets.has(path)).map(async path => {
    const bytes = await readFile(join(dist, path));
    assets.set(path, 'data:' + mediaTypes[extname(path)] + ';base64,' + bytes.toString('base64'));
  }));
  // Keep https links intact, including those whose URL ends in a local asset name.
  return text.replace(assetPattern, (_, prefix, path) => prefix + assets.get(path));
}

// Match the production cascade for the active route. Marketing and contact styles
// have their own global selectors, so including all three cascades changes the tour.
const cssPaths = [];
const styleIds = {};
for (const [kind, page] of Object.entries({ tour: 'index.html', marketing: 'projects/gymdrobe/index.html', contact: 'contact/index.html' })) {
  const source = await readFile(join(dist, page), 'utf8');
  const links = source.split('</head>')[0].match(/<link\b[^>]*>/g) || [];
  styleIds[kind] = links.filter(link => /\brel="stylesheet"/.test(link)).map(link => {
    const path = link.match(/\bhref="(\/[^"]+\.css)"/)?.[1];
    if (!path) throw new Error('Expected a local production stylesheet in ' + page + ': ' + link);
    if (!cssPaths.includes(path)) cssPaths.push(path);
    return cssPaths.indexOf(path);
  });
}
const templates = [];
for (const [id, path] of cssPaths.entries()) {
  const css = await embed(await readFile(join(dist, path), 'utf8'));
  templates.push('<template id="sheet-' + id + '"><style>' + css.replace(/<\/style/gi, '<\\/style') + '</style></template>');
}

const bundle = await build({
  bundle: true, minify: true, write: false, format: 'iife', jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env': '{}' },
  stdin: { loader: 'jsx', resolveDir: root, contents: `
    import { createRoot } from 'react-dom/client';
    import App from './src/App.jsx';
    import MarketingPages from './src/MarketingPages.jsx';
    import ContactPage from './src/fit/ContactPage.jsx';
    import { pageForPath } from './src/seo/pages.js';

    const route = new URLSearchParams(location.search).get('reviewPath') || '/';
    const page = pageForPath(route);
    const kind = route === '/' ? 'tour' : page.path === '/contact/' ? 'contact' : 'marketing';
    for (const id of ${JSON.stringify(styleIds)}[kind]) {
      document.head.append(document.getElementById('sheet-' + id).content.cloneNode(true));
    }

    // Rewrite actual hrefs when React mounts a link, including dialog contents.
    // Native Back, middle-click, keyboard clicks and copied links then use the same route.
    function localize(anchor) {
      const href = anchor.getAttribute('href');
      if (!href?.startsWith('/') || href.startsWith('//')) return;
      const canonical = new URL(href, 'https://fazhere.com');
      if (canonical.pathname.startsWith('/demos/')) {
        anchor.href = canonical.href;
        return;
      }
      const destination = new URL(location.href);
      destination.search = canonical.search;
      if (canonical.pathname !== '/') destination.searchParams.set('reviewPath', canonical.pathname);
      destination.hash = canonical.hash;
      anchor.href = destination.href;
    }
    new MutationObserver(records => {
      for (const record of records) {
        if (record.type === 'attributes') {
          if (record.target.matches('a[href]')) localize(record.target);
        } else {
          for (const node of record.addedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue;
            if (node.matches('a[href]')) localize(node);
            node.querySelectorAll('a[href^="/"]').forEach(localize);
          }
        }
      }
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['href'] });
    const View = kind === 'tour' ? App : kind === 'contact' ? ContactPage : MarketingPages;
    createRoot(document.getElementById('root')).render(<View page={page}/>);
  ` },
  plugins: [{ name: 'standalone-assets', setup(builder) {
    builder.onResolve({filter: /\.bin\?url&inline$/}, args => ({
      path: resolve(args.resolveDir, args.path.split('?')[0]), namespace: 'inline-binary',
    }));
    builder.onLoad({filter: /.*/, namespace: 'inline-binary'}, async args => ({
      contents: 'export default ' + JSON.stringify('data:application/octet-stream;base64,' + (await readFile(args.path)).toString('base64')),
      loader: 'js',
    }));
    builder.onLoad({filter: /\.css$/}, () => ({ contents: '', loader: 'js' }));
  }}],
});
const icon = await embed('<link rel="icon" type="image/png" href="/favicon-32.png">');
const script = (await embed(bundle.outputFiles[0].text)).replace(/<\/script/gi, '<\\/script');
const html = '<!doctype html><html lang="en-IN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Fazhere Studio · Interactive tour</title>' +
  icon + templates.join('\n') + '</head><body><div id="root"></div><script>' + script + '</script></body></html>';

await mkdir(dirname(output), { recursive: true });
await writeFile(output, html);
if (!process.argv[2]) await writeFile(join(dirname(output), 'README.txt'), [
  'Fazhere Studio review', '',
  'Open Fazhere-Studio-Preview.html in a browser. Scroll or choose a room from the directory. In the project room, switch the product colour or open a case study.',
  'The tour, service pages, project pages and contact details work offline. External stores, concept demos, source links and messaging apps need an internet connection.', '',
].join('\n'));
console.log('Standalone review:', output, '(' + Buffer.byteLength(html) + ' bytes, ' + assets.size + ' embedded media files)');
