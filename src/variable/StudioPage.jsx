import { ArrowUpRight } from 'lucide-react';
import { profile } from '../data/portfolio.js';
import AnalyticsPreference from '../components/AnalyticsPreference.jsx';
import './pages.css';

export default function StudioPage({ page, children }) {
  return <div className="studio-document">
    <a href="#main" className="skip-link">Skip to content</a>
    <header className="document-head">
      <a href="/" className="document-mark" aria-label="Fazhere Studio home"><img src="/variable/studio-mark.svg" alt="" width="30" height="30"/>Fazhere Studio</a>
      <nav aria-label="Main navigation"><a href="/#work">Work</a><a href="/services/" aria-current={page.path.startsWith('/services/') ? 'page' : undefined}>Services</a><a className="document-contact" href="/contact/" aria-current={page.path === '/contact/' ? 'page' : undefined}>Contact <ArrowUpRight size={15} aria-hidden="true" /></a></nav>
    </header>
    <main id="main" tabIndex="-1">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="/">Studio</a></li>{page.service && <li><a href="/services/">Services</a></li>}<li aria-current="page">{page.label}</li></ol></nav>
      {children}
    </main>
    <footer className="document-footer">
      <p>Muhammed Favas K<br/><span>Kozhikode, Kerala</span></p>
      <nav aria-label="Footer navigation"><a href="/#work">Work</a><a href="/services/">Services</a><a href="/contact/">Contact</a><a href="/privacy/">Privacy</a><a href={profile.github}>GitHub</a><a href={profile.linkedin}>LinkedIn</a></nav>
      <AnalyticsPreference/>
    </footer>
  </div>;
}
