import AnalyticsPreference from '../components/AnalyticsPreference.jsx';
import { profile } from '../data/portfolio.js';

export function Header({ contact = false }) {
  const home = contact ? '/' : '';
  return (
    <header className="fit-head wrap">
      <a className="brand" href={contact ? '/' : '#home'} aria-label="Fazhere home">
        <i aria-hidden="true" />
        Fazhere.
      </a>
      <nav aria-label="Portfolio navigation">
        <a href={`${home}#projects`}>Work</a>
        <a href={`${home}#services`}>Services</a>
        <a className="nav-contact" href={contact ? '/contact/' : '#contact'} aria-current={contact ? 'page' : undefined}>
          Contact <span aria-hidden="true">↗︎</span>
        </a>
      </nav>
    </header>
  );
}

export function Footer({ contact = false }) {
  return (
    <footer className="fit-foot wrap">
      <a className="brand" href={contact ? '/' : '#home'}>
        Fazhere.
      </a>
      <nav aria-label="Footer">
        <a href={profile.github}>GitHub ↗</a>
        <a href={profile.linkedin}>LinkedIn ↗</a>
        <a href="/privacy/">Privacy</a>
      </nav>
      <AnalyticsPreference />
    </footer>
  );
}
