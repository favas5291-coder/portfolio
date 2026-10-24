const text = (value, max) => String(value || '').trim().slice(0, max);
export function readEnquiry(form) {
  const data = Object.fromEntries(form);
  return { name: text(data.name, 100), email: text(data.email, 254), phone: text(data.phone, 32), business: text(data.business, 150), service: text(data.service, 100), message: text(data.message, 3000), budget: text(data.budget, 100), _gotcha: text(data._gotcha, 200) };
}
export function validateEnquiry(data) {
  const errors = {};
  if (data.name.length < 2) errors.name = 'Enter your name (at least 2 characters).';
  if (!data.email && !data.phone) errors.email = 'Add an email address or phone number so I can reply.';
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Enter a valid email address.';
  if (data.phone && (!/^[+()\d\s.-]+$/.test(data.phone) || data.phone.replace(/\D/g, '').length < 7 || data.phone.replace(/\D/g, '').length > 15)) errors.phone = 'Enter a phone number with 7–15 digits, including country code if needed.';
  if (!data.service) errors.service = 'Choose a service, or select “Not sure yet”.';
  if (data.message.length < 20) errors.message = 'Tell me a little more about the project (at least 20 characters).';
  return errors;
}
export function formEndpoint(id = '') { return /^[a-zA-Z0-9]{6,40}$/.test(id) ? `https://formspree.io/f/${id}` : ''; }
export function enquiryMessage(data) {
  return [`Hi Favas, I’d like to discuss a website.`, `Name: ${data.name}`, data.business && `Business: ${data.business}`, `Service: ${data.service}`, data.email && `Email: ${data.email}`, data.phone && `Phone: ${data.phone}`, data.budget && `Budget: ${data.budget}`, '', data.message].filter(line => line !== false && line !== '').join('\n');
}
export async function submitEnquiry(endpoint, data, { fetcher = fetch, signal } = {}) {
  // Only the public form ID goes in Vite. Delivery credentials belong to Formspree.
  if (!/^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]{6,40}$/.test(endpoint)) throw new Error('Form delivery is not configured. Please use WhatsApp or email.');
  if (data._gotcha) throw new Error('The request could not be submitted. Please use WhatsApp or email.');
  const response = await fetcher(endpoint, { method: 'POST', credentials: 'omit', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, _subject: 'Website project enquiry — fazhere.com' }), signal });
  const body = await response.json().catch(() => null);
  if (response.status === 429) throw new Error('Too many attempts. Please wait before trying again, or use WhatsApp.');
  if (!response.ok || body?.ok !== true) throw new Error('The form service did not confirm your enquiry. Your details are still here; please try WhatsApp or email.');
  return true;
}
