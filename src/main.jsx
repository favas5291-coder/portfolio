import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

const root = document.getElementById('root');
const app = <React.StrictMode><App/></React.StrictMode>;
// The development template contains a comment, but only production has HTML.
if (root.childElementCount > 0) hydrateRoot(root, app);
else createRoot(root).render(app);
