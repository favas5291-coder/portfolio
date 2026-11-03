import { useRef, useState } from 'react';
import { profile, project, skills } from '../data/portfolio.js';
import { projectPreviews } from '../data/project-previews.js';
import { PHONE_DISPLAY, PHONE_HREF, processSteps, services, whatsappHref } from '../data/site.js';
import { evidenceRoot } from './ProductBench.jsx';

const proof = projectPreviews.gymdrobe;
const date = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Kolkata',
});
function Chapter({ n, children }) {
  return (
    <p className="chapter-cap">
      <span>{n}</span>
      <i />
      {children}
    </p>
  );
}
function Capture() {
  const [device, setDevice] = useState('Desktop');
  const dialog = useRef(null),
    button = useRef(null);
  const paired = proof.mobile?.matchesDesktop === proof.screenshot;
  const mobile = paired && device === 'Mobile',
    capture = mobile ? proof.mobile : proof;
  return (
    <figure className="capture">
      <div className="capture-bar">
        <span className="eyeline">Captured preview</span>
        {paired && (
          <div className="tools" role="group" aria-label="Compare desktop and mobile">
            {['Desktop', 'Mobile'].map((d) => (
              <button key={d} aria-pressed={device === d} onClick={() => setDevice(d)}>
                {d}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className={'capture-image' + (mobile ? ' portrait' : '')}>
        <img
          loading="lazy"
          src={capture.screenshot}
          width={capture.width}
          height={capture.height}
          alt={'GymDrobe ' + device.toLowerCase() + ' homepage'}
        />
      </div>
      <figcaption>
        <span>Captured {date.format(new Date(capture.capturedAt))}</span>
        <button ref={button} onClick={() => dialog.current.showModal()}>
          Enlarge screenshot ↗
        </button>
      </figcaption>
      <dialog
        className="fit-dialog capture-dialog"
        ref={dialog}
        aria-label="GymDrobe storefront capture"
        onClose={() => button.current.focus()}
      >
        <div>
          <header>
            <strong>GymDrobe · {device}</strong>
            <button onClick={() => dialog.current.close()}>Close ×</button>
          </header>
          <img
            src={capture.screenshot}
            width={capture.width}
            height={capture.height}
            alt={'Enlarged ' + device.toLowerCase() + ' storefront'}
          />
        </div>
      </dialog>
    </figure>
  );
}
export function Work() {
  return (
    <section id="projects" className="work-band">
      <div className="wrap chapter-pad">
        <Chapter n="01">Selected work</Chapter>
        <div className="work-grid">
          <div>
            <p className="eyeline">{project.category} / Founder & developer</p>
            <h2 className="display">
              Inside <em>GymDrobe.</em>
            </h2>
            <p className="chapter-intro">
              Picking a shirt should be easy. So should knowing exactly which one you picked.
            </p>
            <dl className="story">
              <dt>The shopper’s problem</dt>
              <dd>{project.problem}</dd>
              <dt>What I built</dt>
              <dd>{project.contribution}</dd>
              <dt>A decision you can try</dt>
              <dd>
                Both layouts read the same colour and size selection. Choose red, pick M, then narrow the
                frame. The red photograph and M stay together.{' '}
                <a href="#demonstration">Try the shirt ↑</a>
              </dd>
            </dl>
            <details className="payment">
              <summary>What if a payment times out?</summary>
              <p>
                The frontend tells the shopper their payment may have succeeded and directs them to My
                orders or support before paying again. I checked this message in the source. Live payment
                processing was outside this test.
              </p>
              <a href={evidenceRoot + 'src/services/paymentApi.js'}>Read the payment handling ↗</a>
            </details>
            <div className="work-links">
              <a className="pill" href={project.website}>
                Visit live website ↗
              </a>
              <a href="/projects/gymdrobe/">Read case study</a>
              <a href={project.repository}>View code ↗</a>
              <a href="/contact/">Contact Favas ↗</a>
            </div>
          </div>
          <Capture />
        </div>
      </div>
    </section>
  );
}

const illustrations = {
  'business-websites': {
    steps: ['Service page', 'What you offer', 'Contact'],
    text: 'Customers can read your offer and reach you in the same visit.',
    link: '/services/business-websites/',
    label: 'Follow the service page',
  },
  'ecommerce-development': {
    steps: ['Choose a colour', 'Pick a size', 'Review selection'],
    text: 'You receive a storefront with product selection and a purchase flow scoped to your catalogue.',
    link: '#demonstration',
    label: 'Try the GymDrobe product',
  },
  'landing-pages': {
    steps: ['One offer', 'Proof', 'Enquiry'],
    text: 'You receive one focused page that takes an interested visitor from an offer to your enquiry form.',
    link: '/services/landing-pages/',
    label: 'Follow the enquiry path',
  },
  'website-redesign': {
    steps: ['HTML first', 'Load the frame', 'Try the work'],
    text: 'You receive a clearer mobile layout that preserves working links and enquiry paths.',
    link: '#home',
    label: 'Inspect the opening',
  },
};
export function Services() {
  const [selected, setSelected] = useState(services[0].slug);
  const service = services.find((s) => s.slug === selected),
    illustration = illustrations[selected];
  return (
    <section className="wrap chapter-pad" id="services">
      <Chapter n="02">Services</Chapter>
      <div className="section-heading">
        <h2 className="display">
          What do you <em>need?</em>
        </h2>
        <a className="linkline" href="/services/">
          All services ↗
        </a>
      </div>
      <div className="service-grid">
        <div className="service-choices" role="group" aria-label="Choose a service">
          {services.map((s, i) => (
            <button key={s.slug} aria-pressed={s.slug === selected} onClick={() => setSelected(s.slug)}>
              <small>0{i + 1}</small>
              {s.name}
              <span>{s.slug === selected ? '↗' : '+'}</span>
            </button>
          ))}
        </div>
        <div className="service-paper" key={selected}>
          <span className="eyeline">What you receive</span>
          <h3>{illustration.text}</h3>
          <ol>
            {illustration.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <a href={illustration.link}>{illustration.label} ↗</a>
          <div>
            <a className="pill" href={'/contact/?service=' + selected}>
              Discuss this service ↗
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
const outputs = [
  'A brief naming the customer, products and buying journey.',
  'A scope and quote for the catalogue, variants and checkout.',
  'A working preview where you can try a product on a phone.',
  'Review notes covering product choices, links and checkout states.',
  'The approved site, access and a handover of agreed product updates.',
];
export function Process() {
  return (
    <section className="process-band" id="process">
      <div className="wrap chapter-pad">
        <Chapter n="03">Process</Chapter>
        <div className="work-grid">
          <div>
            <h2 className="display">
              From a brief
              <br />
              to <em>launch.</em>
            </h2>
            <p className="chapter-intro">
              An example handover for a small online store. Open a stage to see what you receive or
              decide.
            </p>
          </div>
          <ol className="stage-list">
            {processSteps.map(([label, desc], i) => (
              <li key={label}>
                <details open={i === 0}>
                  <summary>
                    <span>0{i + 1}</span>
                    {label}
                  </summary>
                  <p>{desc}</p>
                  <p>
                    <b>Example deliverable</b> {outputs[i]}
                  </p>
                </details>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
export function Contact() {
  return (
    <>
      <section id="contact" className="wrap chapter-pad">
        <Chapter n="04">Contact</Chapter>
        <div className="contact-grid">
          <h2 className="display">
            What are you
            <br />
            <em>planning to build?</em>
          </h2>
          <div>
            <p className="chapter-intro">
              Tell me about your business, the people you want to reach and what you need the site to do.
            </p>
            <div className="action-row">
              <a className="pill" href="/contact/">
                Start an enquiry ↗
              </a>
              <a className="linkline" data-contact="whatsapp" href={whatsappHref()}>
                WhatsApp ↗
              </a>
            </div>
            <div className="contact-alt">
              <a data-contact="email" href={'mailto:' + profile.email}>
                {profile.email}
              </a>
              <a data-contact="call" href={PHONE_HREF}>
                {PHONE_DISPLAY}
              </a>
            </div>
          </div>
        </div>
      </section>
      <aside id="about" className="wrap bio">
        <div>
          <span className="eyeline">About Favas</span>
          <p>{profile.about}</p>
        </div>
        <div id="skills">
          <span className="eyeline">Tools I work with</span>
          <p>{skills.map((s) => s.name).join(' · ')}</p>
        </div>
      </aside>
    </>
  );
}
