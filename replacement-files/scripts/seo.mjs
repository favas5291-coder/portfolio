import { SITE_ORIGIN } from '../src/data/site.js';
import { structuredData } from '../src/seo/pages.js';

export const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const isPreview = env => env.SITE_ENV === 'preview' || env.IS_PULL_REQUEST === 'true';
export function renderHead(page, env = {}) {
  const esc = escapeHTML, origin = SITE_ORIGIN, url = `${origin}${page.path}`;
  const noindex = page.noindex || isPreview(env);
  const verification = [['google-site-verification', env.GOOGLE_SITE_VERIFICATION], ['msvalidate.01', env.BING_SITE_VERIFICATION]].filter(([, token]) => token && !page.noindex).map(([name, token]) => `<meta name="${name}" content="${esc(token)}"/>`).join('\n');
  const json = JSON.stringify(structuredData(page, origin)).replaceAll('<', '\\u003c');
  return `<title>${esc(page.title)}</title>
    <meta name="description" content="${esc(page.description)}"/>
    <meta name="robots" content="${noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'}"/>
    ${page.noindex ? '' : `<link rel="canonical" href="${esc(url)}"/>`}
    <meta property="og:type" content="website"/>
    <meta property="og:locale" content="en_IN"/>
    <meta property="og:site_name" content="Favas — The Forge"/>
    <meta property="og:title" content="${esc(page.title)}"/>
    <meta property="og:description" content="${esc(page.description)}"/>
    <meta property="og:url" content="${esc(url)}"/>
    <meta property="og:image" content="${origin}/social-card.png"/>
    <meta property="og:image:width" content="1200"/>
    <meta property="og:image:height" content="630"/>
    <meta property="og:image:alt" content="Muhammed Favas K — web developer, The Forge portfolio"/>
    <meta name="twitter:card" content="summary_large_image"/>
    <meta name="twitter:title" content="${esc(page.title)}"/>
    <meta name="twitter:description" content="${esc(page.description)}"/>
    <meta name="twitter:image" content="${origin}/social-card.png"/>
    ${verification}
    ${page.noindex ? '' : `<script type="application/ld+json">${json}</script>`}`;
}
