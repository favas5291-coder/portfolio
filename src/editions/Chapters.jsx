import { profile, skills } from '../data/portfolio.js';
import { PHONE_DISPLAY, PHONE_HREF, processSteps, services, whatsappHref } from '../data/site.js';
import './chapters.css';

// Each brief leads to a real, inspectable example. Names, service scope, and contact
// destinations continue to come from the same data as the detail pages and form.
const briefs = {
  'business-websites': {
    need: 'I need a business website.',
    delivery: 'Your services, location and contact details in one place, with a clear path from an interested visitor to an enquiry.',
    example: 'Follow the service-to-contact path on this portfolio',
    href: '/services/',
  },
  'ecommerce-development': {
    need: 'I want to sell online.',
    delivery: 'A storefront where customers can choose the right product, review their cart and check out, with a catalogue and order flow scoped to your business.',
    example: 'See how a GymDrobe shopper chooses a product',
    href: '/projects/gymdrobe/',
  },
  'landing-pages': {
    need: 'I’m launching an offer.',
    delivery: 'One page built around your offer, with room for proof and a direct next step for someone arriving from an ad or shared link.',
    example: 'Trace this landing-page offer through to its enquiry',
    href: '/services/landing-pages/',
  },
  'website-redesign': {
    need: 'My website needs a redesign.',
    delivery: 'An agreed set of improvements to the pages your customers use, a clearer mobile layout and a plan for retaining useful links.',
    example: 'Inspect the work and contact links in this opening',
    href: '#home',
  },
};

function Arrow() {
  return (
    <svg className="edc-arrow" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 13 12.5 3.5M4 3.5h8.5V12" />
    </svg>
  );
}

function WhatsAppLink({ message, children }) {
  return (
    <a className="edc-primary" href={whatsappHref(message)} data-contact="whatsapp"
      target="_blank" rel="noopener noreferrer">
      {children}<Arrow />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

export function Services() {
  return (
    <section id="services" className="edc-services edc-band" aria-labelledby="ed-brief-title">
      <div className="ed-wrap edc-layout">
        <header className="edc-heading">
          <p className="edc-kicker">Services</p>
          <h2 className="edc-title" id="ed-brief-title">Choose a <em>brief.</em></h2>
          <a className="edc-text-link" href="/services/">All services <Arrow /></a>
        </header>
        <div className="edc-briefs">
          {services.map((service, index) => {
            const path = `/services/${service.slug}/`;
            const brief = briefs[service.slug];
            return (
              <details key={service.slug} name="edition-service" open={index === 0}>
                <summary><span>{brief?.need ?? service.name}</span><i aria-hidden="true" /></summary>
                <div className="edc-brief-body">
                  {brief?.href === path ? (
                    <span className="edc-service-name">{service.name}</span>
                  ) : (
                    <a className="edc-service-name" href={path}>{service.name}<Arrow /></a>
                  )}
                  <p>{brief?.delivery ?? service.short}</p>
                  {brief && (
                    <a className="edc-text-link" href={brief.href}>{brief.example} <Arrow /></a>
                  )}
                  <div className="edc-actions">
                    <WhatsAppLink message={`Hi Favas, I’m interested in ${service.name.toLowerCase()} for my business. Can we discuss the scope?`}>
                      Discuss this on WhatsApp
                    </WhatsAppLink>
                    <a className="edc-text-link" href={`/contact/?service=${service.slug}#project-enquiry`}>Send a written brief <Arrow /></a>
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const exampleDeliverables = {
  'Discuss requirements': 'You identify the first products, what varies by colour and which questions customers ask before buying.',
  'Agree scope and quote': 'You approve a page list and quote covering the catalogue, product choices and checkout.',
  'Design and development': 'You receive a working preview and try both colours of a sample product on your phone.',
  Review: 'You check that the chosen product reaches the cart with the right colour and mark any details for correction.',
  'Launch and handover': 'You receive the approved store, the agreed access and instructions for updating your catalogue.',
};

export function Process() {
  return (
    <section className="edc-process edc-band" id="process" aria-labelledby="ed-process-title">
      <div className="ed-wrap edc-layout">
        <header className="edc-heading">
          <p className="edc-kicker">Process</p>
          <h2 className="edc-title" id="ed-process-title">From brief to <em>handover.</em></h2>
          <p className="edc-caption">An example project: launching a small online store with two colours of one product.</p>
        </header>
        <ol className="edc-stages">
          {processSteps.map(([stage, description], index) => (
            <li key={stage}>
              <span className="edc-stage-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h3>{stage}</h3>
                <p>{exampleDeliverables[stage] ?? description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Contact() {
  return (
    <section className="edc-end">
      <aside id="about" className="ed-wrap edc-bio" aria-label="About Favas">
        <div>
          <h2 className="edc-kicker">About Favas</h2>
          <p>{profile.about}</p>
        </div>
        <div id="skills">
          <h2 className="edc-kicker">Tools I work with</h2>
          <p>{skills.map(skill => skill.name).join(' · ')}</p>
        </div>
      </aside>
      <div id="contact" className="ed-wrap edc-contact-sheet" role="region" aria-labelledby="ed-contact-title">
        <div className="edc-contact-copy">
          <p className="edc-kicker">Start your edition</p>
          <h2 className="edc-title" id="ed-contact-title">What are you planning to <em>build?</em></h2>
          <div className="edc-actions">
            <WhatsAppLink>Chat on WhatsApp</WhatsAppLink>
            <a className="edc-text-link" href="/contact/">Send a brief <Arrow /></a>
          </div>
        </div>
        <address>
          <strong>{profile.name}</strong>
          <span>{profile.location}</span>
          <a href={`mailto:${profile.email}`} data-contact="email">{profile.email}</a>
          <a href={PHONE_HREF} data-contact="call">{PHONE_DISPLAY}</a>
        </address>
      </div>
    </section>
  );
}
