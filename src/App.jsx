import ActionMark from './components/ActionMark.jsx';
import { useEffect, useState } from 'react';
import { profile } from './data/portfolio.js';
import { projectPreviews } from './data/project-previews.js';
import { whatsappHref } from './data/site.js';
import { Header, Footer } from './fit/Layout.jsx';
import { Services, Process, Contact } from './editions/Chapters.jsx';
import { editions } from './editions/evidence.js';
import ProofPress from './editions/ProofPress.jsx';
import './editions/editions.css';

const proofHash = id => '#proof-' + id;

export default function App() {
  const [edition, setEdition] = useState(editions[0]);
  const [pressVisit, setPressVisit] = useState(0);

  useEffect(() => {
    function readLocation() {
      const match = editions.find(item => proofHash(item.id) === window.location.hash);
      if (match) {
        setEdition(match);
        setPressVisit(count => count + 1);
      } else if (!window.location.hash || window.location.hash === '#home') {
        setEdition(editions[0]);
      }
    }
    readLocation();
    window.addEventListener('hashchange', readLocation);
    return () => window.removeEventListener('hashchange', readLocation);
  }, []);

  function chooseProof(event, item) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    // Hash navigation also supports a direct link, reload and browser Back.
    if (window.location.hash === proofHash(item.id)) {
      setEdition(item);
      setPressVisit(count => count + 1);
    }
  }

  return (
    <div className="editions">
      <a href="#main" className="skip-link">Skip to content</a>
      <Header editions />
      <main id="main" tabIndex={-1}>
        <section id="home" className="ed-opening ed-wrap" aria-labelledby="ed-offer">
          <div className="ed-intro">
            <p className="ed-identity">{profile.name} · Full-stack developer</p>
            <h1 id="ed-offer">I build websites and apps that help businesses <em>grow.</em></h1>
            <div className="ed-hero-actions">
              <a className="ed-primary" href={whatsappHref()} data-contact="whatsapp" target="_blank" rel="noopener noreferrer">Chat on WhatsApp <ActionMark/></a>
              <a className="ed-textlink" href={proofHash('gymdrobe')} onClick={event => chooseProof(event, editions[0])}>View GymDrobe <ActionMark icon="down"/></a>
            </div>
            <p className="ed-location">Independent developer in Kozhikode, India</p>
          </div>
          <ProofPress edition={edition} visit={pressVisit}/>
        </section>
        <section className="ed-work ed-wrap" id="projects" aria-labelledby="ed-work-title">
          <div className="ed-work-head"><h2 id="ed-work-title">Selected <em>editions.</em></h2><span className="ed-small">Project index</span></div>
          <div className="ed-index">
            {editions.map((item, index) => {
              const shot = projectPreviews[item.id];
              return (
                <article key={item.id} className="ed-index-row">
                  <a className="ed-index-load" href={proofHash(item.id)} aria-label={'Load ' + item.name + ' on the press'} onClick={event => chooseProof(event, item)}>
                    <span className="ed-index-number">{String(index + 1).padStart(2, '0')}</span>
                    <img src={shot.screenshot} alt="" loading="lazy" width={shot.width} height={shot.height}/>
                    <span className="ed-entry-title"><strong>{item.name}</strong><span>{item.disclosure}</span></span>
                    <span className="ed-index-arrow" aria-hidden="true"><ActionMark icon="back"/></span>
                  </a>
                  <a className="ed-case" href={item.caseStudy} aria-label={'Read the ' + item.name + ' case study'}>Case study <ActionMark/></a>
                </article>
              );
            })}
          </div>
        </section>
        <Services/><Process/><Contact/>
      </main>
      <Footer />
    </div>
  );
}
