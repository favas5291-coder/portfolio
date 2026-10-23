import { SITE_ORIGIN } from '../data/site.js';
import { pageForPath } from './pages.js';

const key = 'forge-analytics-consent';
let active = false, initialized = false;
const measurementId = import.meta.env?.VITE_GA_MEASUREMENT_ID || '';
export const analyticsConfigured = () => /^G-[A-Z0-9]+$/.test(measurementId);
export const analyticsAllowed = (id, robots = '') => /^G-[A-Z0-9]+$/.test(id) && !/\bnoindex\b/i.test(robots);
export const analyticsAvailable = () => analyticsAllowed(measurementId, document.querySelector('meta[name="robots"]')?.content || '');
export function storedConsent() { try { return localStorage.getItem(key) === 'granted'; } catch { return false; } }
export function consentAnalytics(granted) {
  try { localStorage.setItem(key, granted ? 'granted' : 'denied'); } catch { /* session only */ }
  active = !!granted && analyticsAvailable();
  if (!analyticsAvailable()) return;
  window[`ga-disable-${measurementId}`] = !granted;
  if (!granted) { window.gtag?.('consent', 'update', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' }); return; }
  window.dataLayer ||= [];
  window.gtag ||= function () { window.dataLayer.push(arguments); };
  window.gtag('consent', 'update', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  if (initialized) return;
  initialized = true;
  const page = pageForPath(location.pathname);
  // Do not transmit query strings, fragments, enquiry fields or WhatsApp URLs.
  window.gtag('js', new Date());
  window.gtag('config', measurementId, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false, page_location: `${SITE_ORIGIN}${page.path}`, page_referrer: '' });
  window.gtag('event', 'page_view', { page_location: `${SITE_ORIGIN}${page.path}`, page_title: page.title, page_referrer: '' });
  const script = document.createElement('script');
  script.async = true; script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`; document.head.append(script);
}
export function trackContact(event) {
  if (!active || !['whatsapp_click', 'call_click', 'email_click', 'enquiry_submitted'].includes(event)) return;
  window.gtag?.('event', event, { page_location: `${SITE_ORIGIN}${pageForPath(location.pathname).path}`, page_referrer: '' });
}
export function initAnalytics() {
  if (!analyticsAvailable()) return () => {};
  consentAnalytics(storedConsent());
  const click = event => {
    const type = event.target.closest?.('a[data-contact]')?.dataset.contact;
    if (['whatsapp', 'call', 'email'].includes(type)) trackContact(`${type}_click`);
  };
  document.addEventListener('click', click);
  return () => document.removeEventListener('click', click);
}
