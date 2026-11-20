import { ArrowUpRight } from 'lucide-react';
import EnquiryForm from '../components/EnquiryForm.jsx';
import { profile } from '../data/portfolio.js';
import { PHONE_DISPLAY, PHONE_HREF, whatsappHref } from '../data/site.js';
import StudioPage from '../variable/StudioPage.jsx';

export default function ContactPage() {
  return <StudioPage page={{ path: '/contact/', label: 'Contact' }}>
    <div className="brief-columns">
      <section className="marketing-hero">
        <p className="overline">Muhammed Favas K · Kozhikode</p>
        <h1>Your project.</h1>
        <p className="marketing-lead">What would you like your customers to be able to do?</p>
        <a className="button-solid" href={whatsappHref()} data-contact="whatsapp" target="_blank" rel="noopener noreferrer">Talk to Favas on WhatsApp <ArrowUpRight size={15} aria-hidden="true" /></a>
        <div className="brief-contacts"><a href={`mailto:${profile.email}`} data-contact="email">{profile.email}</a><a href={PHONE_HREF} data-contact="call">{PHONE_DISPLAY}</a></div>
      </section>
      <section className="brief-sheet" id="project-enquiry" aria-labelledby="enquiry-heading">
        <h2 id="enquiry-heading">Send a brief</h2><EnquiryForm/>
      </section>
    </div>
  </StudioPage>;
}
