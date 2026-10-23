import { useEffect, useRef, useState } from 'react';
import { services, whatsappHref } from '../data/site.js';
import { readEnquiry, validateEnquiry, formEndpoint, enquiryMessage, submitEnquiry } from '../enquiries/form.js';
import { trackContact } from '../seo/analytics.js';

export default function EnquiryForm() {
  const endpoint = formEndpoint(import.meta.env.VITE_FORMSPREE_FORM_ID || '');
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('');
  const [pending, setPending] = useState(false);
  const [handoff, setHandoff] = useState('');
  const controller = useRef(null), busy = useRef(false), statusNode = useRef(null);
  useEffect(() => () => controller.current?.abort(), []);
  const submit = async event => {
    event.preventDefault();
    if (busy.current) return;
    const form = event.currentTarget;
    const data = readEnquiry(new FormData(form));
    const nextErrors = validateEnquiry(data);
    setErrors(nextErrors); setStatus(''); setHandoff('');
    if (Object.keys(nextErrors).length) {
      form.elements.namedItem(Object.keys(nextErrors)[0])?.focus(); return;
    }
    if (data._gotcha) { setStatus('The request could not be submitted. Please use a direct contact link.'); return; }
    if (!endpoint) {
      setHandoff(whatsappHref(enquiryMessage(data)));
      setStatus('Your brief is ready. Open WhatsApp, review it and press Send there. Nothing has been sent from this form.');
      requestAnimationFrame(() => statusNode.current?.focus()); return;
    }
    busy.current = true; setPending(true);
    const abort = new AbortController(); controller.current = abort;
    const timeout = setTimeout(() => abort.abort(), 15000);
    try {
      await submitEnquiry(endpoint, data, { signal: abort.signal });
      setStatus('Your enquiry was accepted by the form service. Thank you for sharing your project.');
      form.reset(); trackContact('enquiry_submitted');
    } catch (error) {
      setStatus(error.name === 'AbortError' ? 'Confirmation timed out. Delivery is unconfirmed. Your details are still here; contact me on WhatsApp before sending again.' : error.message);
    } finally { clearTimeout(timeout); busy.current = false; setPending(false); }
  };
  const field = (name, label, props = {}) => <div className="form-field"><label htmlFor={`enquiry-${name}`}>{label}</label><input id={`enquiry-${name}`} name={name} aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `error-${name}` : undefined} {...props}/>{errors[name] && <p className="field-error" id={`error-${name}`}>{errors[name]}</p>}</div>;
  return <form className="enquiry-form" onSubmit={submit} noValidate aria-describedby="form-help" aria-busy={pending}>
    <p id="form-help">Share a short brief. Add at least one contact method. {endpoint ? 'Enquiries are delivered through Formspree.' : 'This form prepares a WhatsApp message for you to review and send.'}</p>
    <fieldset disabled={pending}><legend className="sr-only">Your project enquiry</legend>
      {field('name', 'Your name', { autoComplete: 'name', required: true, minLength: 2, maxLength: 100 })}
      <div className="form-row">{field('email', 'Email (or add a phone number)', { type: 'email', autoComplete: 'email', maxLength: 254 })}{field('phone', 'Phone (or add an email)', { type: 'tel', autoComplete: 'tel', maxLength: 32 })}</div>
      {field('business', 'Business name — optional', { autoComplete: 'organization', maxLength: 150 })}
      <div className="form-field"><label htmlFor="enquiry-service">Service needed</label><select id="enquiry-service" name="service" defaultValue="" required aria-invalid={!!errors.service} aria-describedby={errors.service ? 'error-service' : undefined}><option value="" disabled>Select a service</option>{services.map(s => <option key={s.slug}>{s.name}</option>)}<option>Not sure yet</option></select>{errors.service && <p className="field-error" id="error-service">{errors.service}</p>}</div>
      <div className="form-field"><label htmlFor="enquiry-message">What would you like to build or improve?</label><textarea id="enquiry-message" name="message" rows={5} minLength={20} maxLength={3000} required aria-invalid={!!errors.message} aria-describedby={errors.message ? 'error-message' : 'message-help'}/><p id="message-help" className="field-hint">Describe your business, the goal and any existing website. Please do not include passwords or payment details.</p>{errors.message && <p className="field-error" id="error-message">{errors.message}</p>}</div>
      {field('budget', 'Budget range — optional', { maxLength: 100, placeholder: 'Your planned budget, if you have one' })}
      <div className="form-trap" aria-hidden="true"><label htmlFor="enquiry-website">Leave this field empty</label><input id="enquiry-website" name="_gotcha" tabIndex={-1} autoComplete="off"/></div>
      <button type="submit" className="button-solid">{pending ? 'Submitting…' : endpoint ? 'Request a Quote' : 'Prepare WhatsApp Enquiry'} <span aria-hidden="true">↗</span></button>
    </fieldset>
    <p className="form-privacy">Your details are used to discuss your project. <a href="/privacy/">Privacy & enquiry information</a>.</p>
    <div className="form-status" role="status" aria-live="polite" ref={statusNode} tabIndex={-1}>{status}{handoff && <a href={handoff} target="_blank" rel="noopener noreferrer" className="button-outline" data-contact="whatsapp">Open WhatsApp and review <span className="sr-only">(opens in a new tab)</span><span aria-hidden="true">↗</span></a>}</div>
    <noscript><p>The interactive form needs JavaScript. Please use the WhatsApp, call or email links above to discuss your project.</p></noscript>
  </form>;
}
