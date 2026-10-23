import { PHONE_DISPLAY, PHONE_HREF, whatsappHref } from '../data/site.js';
import { profile } from '../data/portfolio.js';

export function ContactActions({ quote = true, compact = false }) {
  return <div className={`enquiry-actions ${compact ? 'compact' : ''}`}>
    {quote && <a className="button-solid" href="/contact/">Discuss Your Website <span aria-hidden="true">↗</span></a>}
    <a className={quote ? 'button-outline' : 'button-solid'} href={whatsappHref()} target="_blank" rel="noopener noreferrer" data-contact="whatsapp">WhatsApp Me <span className="sr-only">(opens in a new tab)</span><span aria-hidden="true">↗</span></a>
    {!compact && <a className="text-link" href={PHONE_HREF} data-contact="call">Call {PHONE_DISPLAY}</a>}
  </div>;
}
export function ContactDetails({ showEmail = true }) {
  return <div className="direct-contact"><a href={PHONE_HREF} data-contact="call">Call {PHONE_DISPLAY}</a>{showEmail && <a href={`mailto:${profile.email}`} data-contact="email">{profile.email}</a>}<p>{profile.location}<br/>Remote projects across India.</p></div>;
}
export function MobileContact() { return <a className="mobile-contact" href={whatsappHref()} target="_blank" rel="noopener noreferrer" data-contact="whatsapp">Discuss a website on WhatsApp <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a>; }
