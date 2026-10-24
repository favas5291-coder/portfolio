import { SITE_ORIGIN, services } from '../data/site.js';
import { profile } from '../data/portfolio.js';

export const pages = [
  { path: '/', label: 'Home', title: 'Freelance Web Developer in Kozhikode | Muhammed Favas K', description: 'I’m Favas, a freelance web developer in Kozhikode (Calicut), Kerala. Business websites, online stores and landing pages. Available for remote projects across India.' },
  { path: '/services/', label: 'Services', title: 'Freelance Website Development Services | Favas, Kerala', description: 'Explore business websites, custom e-commerce development, landing pages and website redesign with Favas in Kozhikode, Kerala. Find the right scope and request a quote.' },
  ...services.map(service => ({ path: `/services/${service.slug}/`, label: service.name, title: service.title, description: service.description, service })),
  { path: '/projects/gymdrobe/', label: 'GymDrobe', title: 'GymDrobe Case Study — MERN E-commerce Project | Favas', description: 'Explore GymDrobe, Muhammed Favas K’s own fitness e-commerce project: the business problem, React storefront, purchase flow and full stack development contribution.' },
  { path: '/contact/', label: 'Contact', title: 'Discuss Your Website — Contact Favas in Kozhikode', description: 'Need a business website, online store or landing page? Contact freelance web developer Muhammed Favas K in Kozhikode by WhatsApp, phone, email or project enquiry.' },
  { path: '/privacy/', label: 'Privacy', title: 'Privacy & Enquiry Information | Favas', description: 'How project enquiries and optional analytics are handled on fazhere.com. Contact Favas about your information or update your analytics preference.' },
];
export const notFound = { path: '/404.html', label: 'Page not found', title: 'Page Not Found | Favas', description: 'This page could not be found. Browse website development services or contact Muhammed Favas K.', noindex: true };
export function normalizePath(path = '/') {
  const clean = String(path).split(/[?#]/)[0];
  if (clean === '/index.html') return '/';
  return clean === '/' || clean.endsWith('.html') ? clean : `${clean.replace(/\/+$/, '')}/`;
}
export function pageForPath(path) { return pages.find(page => page.path === normalizePath(path)) || notFound; }
export function structuredData(page, origin = SITE_ORIGIN) {
  const personID = `${origin}/#person`, siteID = `${origin}/#website`;
  const url = `${origin}${page.path}`;
  const graph = [
    { '@type': 'Person', '@id': personID, name: 'Muhammed Favas K', url: `${origin}/`, jobTitle: 'Freelance Web Developer / MERN Stack Developer', email: `mailto:${profile.email}`, telephone: '+918156805806', sameAs: [profile.github, profile.linkedin].filter(Boolean), homeLocation: { '@type': 'Place', name: 'Kozhikode (Calicut), Kerala, India' }, knowsAbout: ['JavaScript', 'React', 'Node.js', 'Express', 'MongoDB', 'Tailwind CSS', 'Git', 'GitHub'] },
    { '@type': 'WebSite', '@id': siteID, url: `${origin}/`, name: 'Favas — The Forge', publisher: { '@id': personID }, inLanguage: 'en-IN' },
    { '@type': page.path === '/contact/' ? 'ContactPage' : page.path === '/services/' ? 'CollectionPage' : 'WebPage', '@id': `${url}#page`, url, name: page.title, description: page.description, isPartOf: { '@id': siteID }, about: { '@id': personID }, inLanguage: 'en-IN' },
  ];
  if (page.service) graph.push({ '@type': 'Service', '@id': `${url}#service`, name: page.service.name, serviceType: page.service.name, description: page.service.short, url, provider: { '@id': personID }, areaServed: ['Kozhikode', 'Kerala', 'India'].map(name => ({ '@type': 'Place', name })) });
  if (page.path !== '/' && !page.noindex) {
    const crumbs = [{ name: 'Home', path: '/' }];
    if (page.service) crumbs.push({ name: 'Services', path: '/services/' });
    crumbs.push({ name: page.label, path: page.path });
    graph.push({ '@type': 'BreadcrumbList', '@id': `${url}#breadcrumbs`, itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: `${origin}${c.path}` })) });
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}
