import Arrow from '../components/Arrow.jsx';
import EnquiryForm from '../components/EnquiryForm.jsx';
import { profile } from '../data/portfolio.js';
import { PHONE_DISPLAY, PHONE_HREF, processSteps, whatsappHref } from '../data/site.js';
import { Header, Footer } from './Layout.jsx';
import './fit.css';
import './contact.css';

export default function ContactPage() {
  return (
    <div className="fit fit-contact">
      <a href="#main" className="skip-link">Skip to content</a>
      <Header contact />
      <main id="main" tabIndex={-1}>
        <nav className="contact-breadcrumb wrap" aria-label="Breadcrumb">
          <ol>
            <li><a href="/">Home</a></li>
            <li aria-current="page">Contact</li>
          </ol>
        </nav>
        <section className="contact-page wrap" aria-labelledby="contact-title">
          <div className="contact-introduction">
            <p className="eyeline">Muhammed Favas K · Let’s work together</p>
            <h1 id="contact-title">What are you planning to <em>build?</em></h1>
            <p className="contact-lead">Message me on WhatsApp about your business and what you need. We can discuss the scope and a quote.</p>
            <div className="action-row">
              <a className="pill" href={whatsappHref()} data-contact="whatsapp" target="_blank" rel="noopener noreferrer">
                Chat on WhatsApp <Arrow />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              <a className="linkline" href="#project-enquiry">Send a brief <Arrow down /></a>
            </div>
            <div className="contact-direct">
              <a href={`mailto:${profile.email}`} data-contact="email">
                <span className="eyeline">Email</span><span>{profile.email}</span><Arrow />
              </a>
              <a href={PHONE_HREF} data-contact="call">
                <span className="eyeline">Call</span><span>{PHONE_DISPLAY}</span><Arrow />
              </a>
            </div>
            <p className="contact-place">{profile.location}<br />Remote projects across India.</p>
          </div>
          <div className="contact-paper" id="project-enquiry" tabIndex={-1}>
            <p className="eyeline">Project enquiry</p>
            <h2>A few details to begin.</h2>
            <EnquiryForm />
          </div>
        </section>
        <section className="contact-next wrap" aria-labelledby="contact-next-title">
          <div className="contact-next-heading">
            <p className="eyeline">From the first conversation</p>
            <h2 id="contact-next-title">What happens next.</h2>
          </div>
          <ol>
            {processSteps.map(([name, detail], index) => (
              <li key={name}>
                <span className="eyeline">0{index + 1}</span>
                <h3>{name}</h3>
                <p>{detail}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>
      <Footer contact />
    </div>
  );
}
