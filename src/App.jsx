import ProductBench from './fit/ProductBench.jsx';
import { Work, Services, Process, Contact } from './fit/Chapters.jsx';
import { Header, Footer } from './fit/Layout.jsx';
import { profile } from './data/portfolio.js';
import { whatsappHref } from './data/site.js';
import './fit/fit.css';

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
              <a className="pill" href={whatsappHref()} data-contact="whatsapp" target="_blank" rel="noopener noreferrer">
                Chat on WhatsApp <span aria-hidden="true">↗︎</span>
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              <a className="linkline" href="#projects">
                View GymDrobe <span aria-hidden="true">↓</span>
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
      <Footer />
    </div>
  );
}
