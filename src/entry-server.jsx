import React from 'react';
import { renderToString } from 'react-dom/server';
import App from './App';
import MarketingPages from './MarketingPages.jsx';
import { pageForPath } from './seo/pages.js';

export const render = (path = '/') => {
  const page = pageForPath(path);
  return renderToString(<React.StrictMode>{page.path === '/' ? <App/> : <MarketingPages page={page}/>}</React.StrictMode>);
};
