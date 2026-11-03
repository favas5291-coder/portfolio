import ProductBench from './fit/ProductBench.jsx';
import { Work, Services, Process, Contact } from './fit/Chapters.jsx';
import AnalyticsPreference from './components/AnalyticsPreference.jsx';
import { profile } from './data/portfolio.js';
import './fit/fit.css';

function Header() {
  return (
    <header className="fit-head wrap">
      <a className="brand" href="#home" aria-label="Fazhere home">
        <i aria-hidden="true" />
        Fazhere.
      </a>
      <nav aria-label="Portfolio navigation">
        <a href="#projects">Work</a>
        <a href="#services">Services</a>
        <a className="nav-contact" href="#contact">
          Contact ↗
        </a>
      </nav>
    </header>
  );
}
export default function App() {
  return (
    <div className="fit">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header />
      <main id="main" tabIndex={-1}>
        <section id="home" className="opening wrap">
          <div className="intro">
            <p className="identity">{profile.name} · Full-stack developer</p>
            <h1>
              I build websites and apps that help businesses <em>grow.</em>
            </h1>
            <p className="lede">
              I’m Favas, a developer from Kozhikode. Try a product from the fitness store I founded.
            </p>
            <div className="action-row">
              <a className="pill" href="#projects">
                View GymDrobe <span aria-hidden="true">↓</span>
              </a>
              <a className="linkline" href="/contact/">
                Discuss a project ↗
              </a>
            </div>
            <span className="folio">Independent practice · Kozhikode, India</span>
          </div>
          <ProductBench />
        </section>
        <Work />
        <Services />
        <Process />
        <Contact />
      </main>
      <footer className="fit-foot wrap">
        <a className="brand" href="#home">
          Fazhere.
        </a>
        <nav aria-label="Footer">
          <a href={profile.github}>GitHub ↗</a>
          <a href={profile.linkedin}>LinkedIn ↗</a>
          <a href="/privacy/">Privacy</a>
        </nav>
        <AnalyticsPreference />
      </footer>
    </div>
  );
}
