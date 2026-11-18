import { useEffect, useState } from 'react';
import { fabea, luxvibe, profile, project, skills } from '../data/portfolio.js';
import { projectPreviews } from '../data/project-previews.js';
import { PHONE_DISPLAY, PHONE_HREF, processSteps, services, whatsappHref } from '../data/site.js';
import { evidenceRoot, productURL } from '../data/product-evidence.js';
import './destinations.css';

const works = [
  {
    ...project,
    id: 'gymdrobe',
    href: '/projects/gymdrobe/',
    live: project.website,
    caption: 'Founder & developer',
  },
  { ...luxvibe, id: 'luxvibe', href: luxvibe.caseStudy, live: luxvibe.demo, caption: luxvibe.status },
  { ...fabea, id: 'fabea', href: fabea.caseStudy, live: fabea.demo, caption: fabea.status },
];

export const destinations = Object.fromEntries(
  [
    ...works,
    { id: 'workshop', name: 'Service workshop', href: '/services/' },
    { id: 'office', name: 'Fazhere office', href: '/contact/' },
  ].map((place) => [place.id, place]),
);

export function openDestination(event, id, onOpen) {
  if (
    !onOpen ||
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
    return;
  event.preventDefault();
  onOpen(id);
}

const arrow = (
  <svg aria-hidden="true" className="stop-arrow" viewBox="0 0 18 18" fill="none">
    <path d="M3 15 15 3M4 3h11v11" stroke="currentColor" strokeWidth="1.7" />
  </svg>
);
const date = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Kolkata',
});

function paired(preview) {
  return preview.mobile?.matchesDesktop === preview.screenshot;
}

function Capture({ work }) {
  const proof = projectPreviews[work.id];
  const [device, setDevice] = useState(null);
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 640px)');
    const update = () => setPhone(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const mobile = paired(proof) && (device ? device === 'Mobile' : phone);
  const capture = mobile ? proof.mobile : proof;
  return (
    <figure className="stop-capture">
      <div className="stop-capture-head">
        <span className="stop-label">Homepage capture</span>
        {paired(proof) && (
          <div className="stop-toggle" role="group" aria-label="Choose a capture">
            {['Desktop', 'Mobile'].map((name) => (
              <button
                key={name}
                type="button"
                aria-pressed={mobile === (name === 'Mobile')}
                onClick={() => setDevice(name)}
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>
      <a
        className={'stop-image-link' + (mobile ? ' is-portrait' : '')}
        href={capture.screenshot}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={'Open full-size ' + work.name + ' screenshot in a new tab'}
      >
        <img
          src={capture.screenshot}
          width={capture.width}
          height={capture.height}
          alt={work.name + ' ' + (mobile ? 'mobile' : 'desktop') + ' storefront'}
        />
      </a>
      <figcaption>
        <span>{date.format(new Date(capture.capturedAt))}</span>
        <a href={capture.screenshot} target="_blank" rel="noopener noreferrer">
          Open full size {arrow}
          <span className="stop-sr"> (new tab)</span>
        </a>
      </figcaption>
    </figure>
  );
}

function Discussion({ subject, children }) {
  const href = subject
    ? whatsappHref('Hi Favas, I’d like to discuss ' + subject + ' for my business.')
    : whatsappHref();
  return (
    <a className="stop-action" href={href} data-contact="whatsapp">
      {children} {arrow}
    </a>
  );
}

function WorkDetail({ work }) {
  const flagship = work.id === 'gymdrobe';
  return (
    <article className="stop-content">
      <p className="stop-label">
        {work.caption} · {work.category}
      </p>
      <h2>{work.name}</h2>
      <p className="stop-lead">{work.description}</p>
      <div className="stop-actions">
        <a className="stop-action" href={work.live}>
          {flagship ? 'Visit live store' : 'Open working demo'} {arrow}
        </a>
        <a href={work.href}>Read case study {arrow}</a>
        {work.repository && <a href={work.repository}>View code {arrow}</a>}
      </div>
      <Capture work={work} />
      <dl className="stop-story">
        <dt>The customer’s problem</dt>
        <dd>{work.problem}</dd>
        <dt>What I built</dt>
        <dd>{work.contribution}</dd>
      </dl>
      {flagship ? (
        <div className="stop-evidence">
          <h3>Keep the shopper’s size when the colour changes.</h3>
          <p>
            On the COITONIC shirt, selecting red replaced the black product photo. Both colours offered medium, so
            switching colours kept M selected.
          </p>
          <div className="stop-actions">
            <a href={productURL}>See the product {arrow}</a>
            <a href={evidenceRoot + 'src/pages/ProductPage.jsx'}>Inspect the reviewed code {arrow}</a>
          </div>
        </div>
      ) : (
        <p className="stop-disclosure">
          {work.id === 'fabea'
            ? 'Independent storefront concept with sample products and generated photography.'
            : 'Independent, uncommissioned concept with illustrative stock and generated imagery. The demo previews an enquiry and simulates owner tools.'}
        </p>
      )}
      <div className="stop-actions">
        <Discussion subject={'a store like ' + work.name}>Discuss a similar store</Discussion>
        <a href="/contact/">Contact options {arrow}</a>
      </div>
    </article>
  );
}

const needs = {
  'business-websites': ['I want a website for my business', 'See a service page', '/services/business-websites/'],
  'ecommerce-development': ['I want to sell online', 'See GymDrobe’s shopping flow', '/projects/gymdrobe/'],
  'landing-pages': ['I want enquiries for an offer', 'Follow an offer to its enquiry', '/services/landing-pages/'],
  'website-redesign': [
    'I want to improve my website',
    'Explore the redesign service',
    '/services/website-redesign/',
  ],
};

function ServiceWorkshop() {
  const [selected, setSelected] = useState(services[0].slug);
  const service = services.find(({ slug }) => slug === selected);
  const [, example, href] = needs[selected];
  return (
    <div className="stop-workshop">
      <div className="stop-needs" role="group" aria-label="Choose your business need">
        {services.map(({ name, slug }) => (
          <button key={slug} type="button" aria-pressed={slug === selected} onClick={() => setSelected(slug)}>
            {needs[slug][0]}
            <span aria-hidden="true">→</span>
            <span className="stop-sr">{' · ' + name}</span>
          </button>
        ))}
      </div>
      <div className="stop-offer">
        <p className="stop-label">What you receive</p>
        <h3>{service.name}</h3>
        <p>{service.short}</p>
        <ul>
          {service.deliverables.slice(0, 2).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <a href={href}>
          {example} {arrow}
        </a>
        <div className="stop-actions">
          <Discussion subject={service.name.toLowerCase()}>Discuss on WhatsApp</Discussion>
          <a href={'/contact/?service=' + selected + '#project-enquiry'}>Send a brief {arrow}</a>
        </div>
      </div>
    </div>
  );
}

function Process({ inDirectory }) {
  return (
    <details className="stop-process" id={inDirectory ? 'process' : undefined} open={inDirectory || undefined}>
      <summary>From the first brief to handover</summary>
      <ol>
        {processSteps.map(([name, detail]) => (
          <li key={name}>
            <strong>{name}</strong>
            <p>{detail}</p>
          </li>
        ))}
      </ol>
    </details>
  );
}

function Office({ inDirectory = false }) {
  return (
    <>
      <p className="stop-lead">
        Tell me about your business, who you want to reach, and what the website should do for them.
      </p>
      <div className="stop-actions">
        <Discussion>Chat on WhatsApp</Discussion>
        <a href="/contact/#project-enquiry">Send a project enquiry {arrow}</a>
      </div>
      <div className="stop-direct">
        <a href={'mailto:' + profile.email} data-contact="email">
          {profile.email}
        </a>
        <a href={PHONE_HREF} data-contact="call">
          {PHONE_DISPLAY}
        </a>
      </div>
      <Process inDirectory={inDirectory} />
    </>
  );
}

export function Destination({ id }) {
  if (id === 'workshop' || id === 'services')
    return (
      <article className="stop-content">
        <p className="stop-label">Service workshop</p>
        <h2>What do you need to build?</h2>
        <ServiceWorkshop />
        <a href="/services/">Explore all services {arrow}</a>
      </article>
    );
  if (id === 'office' || id === 'contact')
    return (
      <article className="stop-content">
        <p className="stop-label">Fazhere office · {profile.location}</p>
        <h2>What are you planning to build?</h2>
        <Office />
      </article>
    );
  return destinations[id] ? <WorkDetail key={id} work={destinations[id]} /> : null;
}

export function BrowsePortfolio({ onOpen }) {
  return (
    <div className="stop-browse">
      <section id="projects" className="stop-section">
        <header className="stop-section-head">
          <p className="stop-label">Project street</p>
          <h2>Selected work</h2>
        </header>
        <div className="stop-projects">
          {works.map((work) => {
            const preview = projectPreviews[work.id];
            return (
              <article key={work.id} className="stop-project">
                <a
                  className="stop-thumb"
                  href={work.href}
                  onClick={(event) => openDestination(event, work.id, onOpen)}
                  aria-label={'Explore ' + work.name}
                >
                  <picture>
                    {paired(preview) && (
                      <source
                        media="(max-width: 600px)"
                        srcSet={preview.mobile.screenshot}
                        width={preview.mobile.width}
                        height={preview.mobile.height}
                      />
                    )}
                    <img
                      loading="lazy"
                      src={preview.screenshot}
                      width={preview.width}
                      height={preview.height}
                      alt={work.name + ' storefront'}
                    />
                  </picture>
                </a>
                <div>
                  <p className="stop-label">{work.caption}</p>
                  <h3 id={work.id === 'gymdrobe' ? undefined : work.id + '-work-title'}>
                    <a href={work.href} onClick={(event) => openDestination(event, work.id, onOpen)}>
                      {work.name} {arrow}
                    </a>
                  </h3>
                  <p>{work.description}</p>
                  {work.id !== 'gymdrobe' && <small>Sample products and generated imagery.</small>}
                  <div className="stop-project-links">
                    <a href={work.live}>
                      {work.id === 'gymdrobe' ? 'Visit live store' : 'Try demo'} {arrow}
                    </a>
                    <a href={work.href}>Case study {arrow}</a>
                    {work.repository && <a href={work.repository}>Code {arrow}</a>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
      <section className="stop-section" id="services">
        <header className="stop-section-head">
          <p className="stop-label">Service workshop</p>
          <h2>What do you need to build?</h2>
          <a href="/services/">All services {arrow}</a>
        </header>
        <ServiceWorkshop />
      </section>
      <section className="stop-section" id="contact">
        <div className="stop-office">
          <header className="stop-section-head">
            <p className="stop-label">Fazhere office</p>
            <h2>What are you planning to build?</h2>
          </header>
          <div>
            <Office inDirectory />
          </div>
        </div>
      </section>
      <section className="stop-bio stop-section" id="about">
        <div>
          <h2>About Favas</h2>
          <p>{profile.about}</p>
          <div className="stop-direct">
            <a href={profile.github}>GitHub {arrow}</a>
            <a href={profile.linkedin}>LinkedIn {arrow}</a>
            <a href="/contact/">Contact {arrow}</a>
          </div>
        </div>
        <div id="skills">
          <h2>Tools I work with</h2>
          <p>{skills.map(({ name }) => name).join(' · ')}</p>
        </div>
      </section>
    </div>
  );
}
