import { useRef, useState } from 'react';
import { project } from '../data/portfolio.js';
import { projectPreviews } from '../data/project-previews.js';
import './project.css';

const preview = projectPreviews.gymdrobe;
const colours = [
  { name: 'Black', ink: '#252626', photo: '/images/projects/gymdrobe-shirt-black.webp' },
  { name: 'Red', ink: '#bd302c', photo: '/images/projects/gymdrobe-shirt-red.webp' },
];
const swatchSource = project.repository + '/blob/935e09add8383cfa104379f83e002ed3b0834b8f/src/components/ProductCard.jsx';
const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });

function SwatchDemo() {
  const [colour, setColour] = useState(colours[0]);
  return <div className="quay-demo">
    <div className="quay-swatch-image"><img loading="lazy" decoding="async" src={colour.photo} alt={colour.name + ' COITONIC compression shirt'}/></div>
    <div className="quay-swatch-details">
      <span className="quay-label">Local demo · Colour preview</span>
      <h4>See it in another colour.</h4>
      <p>Compare the COITONIC shirt on the collection card before opening its product page.</p>
      <div className="quay-swatches" role="group" aria-label="Shirt colour">
        {colours.map(item => <button type="button" key={item.name} aria-pressed={colour === item} onClick={() => setColour(item)}>
          <i aria-hidden="true" style={{ backgroundColor: item.ink }}/>{item.name}
        </button>)}
      </div>
      <small role="status">{colour.name} shirt selected</small>
      <a href={swatchSource} target="_blank" rel="noopener noreferrer">Inspect the swatch code ↗</a>
    </div>
  </div>;
}

export default function ProjectViewer() {
  const [device, setDevice] = useState('Desktop');
  const dialog = useRef(null);
  const enlarge = useRef(null);
  // Offer a portrait only when it shows the same storefront as the active desktop.
  const mobileAvailable = preview.mobile?.matchesDesktop === preview.screenshot;
  const mobile = device === 'Mobile' && mobileAvailable;
  const capture = mobile ? preview.mobile : preview;
  const alt = mobile ? 'GymDrobe mobile homepage with search and the Built for your every move collection.' : project.screenshotAlt;
  const date = dateFormat.format(new Date(capture.capturedAt));
  return <article className="quay-project" aria-labelledby="quay-project-title">
    <div className="quay-project-copy">
      <span className="quay-label">01 / {project.category}</span>
      <h3 id="quay-project-title">{project.name}</h3>
      <p>{project.description}</p>
      <p className="quay-contribution"><strong>My work</strong> {project.contribution}</p>
      <div className="quay-project-links">
        <a href={project.website} target="_blank" rel="noopener noreferrer">Visit live website <span aria-hidden="true">↗</span></a>
        <a href="/projects/gymdrobe/">Read case study <span aria-hidden="true">→</span></a>
        <a href={project.repository} target="_blank" rel="noopener noreferrer">View code <span aria-hidden="true">↗</span></a>
      </div>
    </div>
    <figure className="quay-viewer">
      <div className="quay-toolbar">
        <span className="quay-label">Public storefront</span>
        {mobileAvailable && <div role="group" aria-label="Screenshot layout">
          {['Desktop', 'Mobile'].map(name => <button key={name} type="button" aria-pressed={name === device} onClick={() => setDevice(name)}>{name}</button>)}
        </div>}
      </div>
      <div className={'quay-capture' + (mobile ? ' quay-capture-mobile' : '')}>
        <img loading="lazy" decoding="async" src={capture.screenshot} width={capture.width} height={capture.height} alt={alt}/>
      </div>
      <figcaption><small>Captured <time dateTime={capture.capturedAt}>{date}</time></small>
        <button type="button" ref={enlarge} onClick={() => dialog.current?.showModal()}>Enlarge screenshot <span aria-hidden="true">⤢</span></button>
      </figcaption>
    </figure>
    <SwatchDemo/>
    <dialog className="quay-dialog" aria-label="GymDrobe screenshot" ref={dialog}
      onClose={() => enlarge.current?.focus()} onClick={event => { if (event.target === dialog.current) dialog.current.close(); }}>
      <div className="quay-dialog-panel">
        <header><span>{project.name} · {device}</span><button type="button" onClick={() => dialog.current.close()}>Close screenshot</button></header>
        <img loading="lazy" src={capture.screenshot} alt={alt} width={capture.width} height={capture.height}/>
        <p>Captured {date}</p>
      </div>
    </dialog>
  </article>;
}
