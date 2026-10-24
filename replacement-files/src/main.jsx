import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { pageForPath } from './seo/pages.js';
import { initAnalytics } from './seo/analytics.js';
import './styles.css';

async function start() {
  const page = pageForPath(location.pathname);
  const { default: Page } = page.path === '/' ? await import('./App.jsx') : await import('./MarketingPages.jsx');
  const root = document.getElementById('root');
  const app = <React.StrictMode><Page page={page}/></React.StrictMode>;
  // All public pages have build-time HTML; navigation uses ordinary links.
  if (root.childElementCount > 0) hydrateRoot(root, app);
  else createRoot(root).render(app);
  initAnalytics();
}
start().catch(() => { /* Prerendered content and direct contact links stay usable. */ });
