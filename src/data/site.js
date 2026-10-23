// Updated by scripts/set-site-url.mjs. Never put credentials in this file.
export const SITE_ORIGIN = 'https://fazhere.com';
export const WHATSAPP_NUMBER = '918156805806';
export const PHONE_DISPLAY = '+91 8156805806';
export const PHONE_HREF = 'tel:+918156805806';
export const DEFAULT_MESSAGE = 'Hi Favas, I’m interested in a website for my business.';
export const whatsappHref = (message = DEFAULT_MESSAGE) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

export const processSteps = [
  ['Discuss requirements', 'Tell me about your business, customers and what the website needs to do.'],
  ['Agree scope and quote', 'We agree on the pages, features, responsibilities and quote before development.'],
  ['Design and development', 'I build the interface and the agreed functionality, with mobile use in mind.'],
  ['Review', 'We check the content, forms and important journeys together before launch.'],
  ['Launch and handover', 'Publish the approved website and hand over the agreed access and project information.'],
];

export const services = [
  {
    slug: 'business-websites', name: 'Business websites', short: 'Help customers understand your business and take the next step.',
    heading: 'A clear website for your business.',
    title: 'Business Website Development in Kozhikode | Favas',
    description: 'Business website development for small businesses in Kozhikode and Kerala. Clear service pages, mobile layouts and easy customer contact. Request a quote.',
    audience: 'For small businesses and independent professionals who need a useful home online, beyond a social media profile.',
    problem: 'Customers should be able to find what you offer, where you work and how to reach you. A confusing page or a contact link that is hard to find adds friction to that decision.',
    deliverables: ['A responsive layout for phones, tablets and desktops', 'Agreed pages for your business, services and contact details', 'Clear WhatsApp, phone and email actions', 'Page titles, descriptions, sitemap and crawlable content', 'A launch review of links, forms and key pages'],
    evidence: 'This portfolio shows a responsive, prerendered website with service information and direct contact actions. GymDrobe shows how I organise more detailed product information and navigation.',
    faqs: [
      ['What should I prepare?', 'Your business name, the services you offer, the customers you want to reach, and any existing logo, photos or website. We can identify missing content when agreeing the scope.'],
      ['Can a business in Calicut work with you?', 'Yes. I am based in Kozhikode, also known as Calicut, and work remotely with businesses across Kerala and India.'],
      ['What will it cost?', 'Request a quote. The number of pages, content, functionality and existing setup determine the scope and price.'],
      ['Will the site be guaranteed to rank on Google?', 'No ranking is guaranteed. Clear content and sound technical foundations help search engines understand a site; competition and many other factors affect visibility.'],
    ],
  },
  {
    slug: 'ecommerce-development', name: 'E-commerce development', short: 'Connect product browsing, selection and checkout in one store.',
    heading: 'An online store built around the purchase.',
    title: 'E-commerce Website Developer in Kerala | Favas',
    description: 'Custom e-commerce website development with React and the MERN stack. Product variants, cart, checkout and order flows. Explore GymDrobe and request a quote.',
    audience: 'For businesses that need a custom online store and want to discuss their product, payment and order-management requirements.',
    problem: 'Selling online involves more than a product grid. Customers need to choose the right variant, understand the total and complete checkout; the business needs to manage the resulting orders.',
    deliverables: ['A responsive storefront and product detail pages', 'Product variants, stock selection and a cart within the agreed scope', 'Checkout and payment-provider integration where agreed', 'Customer and order-management flows matched to the project', 'A review of purchase, cancellation and error states before launch'],
    evidence: 'GymDrobe is my own fitness e-commerce project. Its React storefront includes variant selection, cart and wishlist state, checkout, Razorpay integration and order-management interfaces.',
    faqs: [
      ['Can you build a custom React store?', 'Yes. My current work uses React, Node.js, Express and MongoDB. We first define the catalogue, purchase flow and admin requirements.'],
      ['Can I use Razorpay?', 'I have integrated Razorpay in GymDrobe. A live integration depends on your approved payment-provider account and credentials, which stay on the server.'],
      ['Do you offer Shopify or WordPress store development?', 'Those platforms are not listed as services here. My demonstrated stack is React and MERN; tell me about an existing platform before we agree on work.'],
      ['Can I see a real example?', 'Yes. Visit GymDrobe or read the case study on this site. It is my own project, rather than paid client work.'],
    ],
  },
  {
    slug: 'landing-pages', name: 'Landing pages', short: 'Give one offer one focused page and a clear enquiry action.',
    heading: 'One offer. A clear next step.',
    title: 'Landing Page Developer for Business Enquiries | Favas',
    description: 'Focused, responsive landing pages for a business, service or campaign. Clear copy, useful proof and WhatsApp or enquiry actions. Request a project quote.',
    audience: 'For a business introducing a service, sharing a campaign link or explaining a specific offer to potential customers.',
    problem: 'A visitor arriving from an ad or a shared link needs to understand the offer quickly. Competing messages, heavy loading and a hidden contact option make that harder.',
    deliverables: ['A focused page structure for one agreed audience and offer', 'Responsive layout, clear headings and prominent contact actions', 'Space for your real product images or project evidence', 'An enquiry path using WhatsApp, email or a configured form service', 'Optional contact-click measurement with your analytics configuration'],
    evidence: 'The service pages on this site keep the message and contact actions in the returned HTML. The main portfolio demonstrates how motion can remain separate from essential content.',
    faqs: [
      ['Can the page be used with an advertising campaign?', 'Yes. We can match the page to a specific offer and prepare contact-action measurement. Ad accounts, campaign management and ad spend are separate from page development.'],
      ['Will you promise more leads?', 'No. A clearer page can remove avoidable friction, but results also depend on the offer, audience and traffic. Enquiry quality needs to be measured after launch.'],
      ['Do I need a full website first?', 'No. A landing page can be a focused starting point. We should still make your identity, offer and contact information clear.'],
    ],
  },
  {
    slug: 'website-redesign', name: 'Website redesign', short: 'Improve an existing site’s clarity, mobile layout and enquiry flow.',
    heading: 'Make your existing website easier to use.',
    title: 'Website Redesign Services in Kozhikode | Favas',
    description: 'Website redesign and React website improvements for businesses in Kozhikode and Kerala. Review mobile layouts, service clarity, speed and contact journeys.',
    audience: 'For businesses with an existing website that is difficult to use on mobile, unclear about its services or awkward to contact through.',
    problem: 'A redesign should address a specific problem. Before proposing changes, I inspect the existing site and available code, identify the important pages and agree on what should be preserved.',
    deliverables: ['A review of your current pages, navigation and contact journey', 'An agreed redesign scope based on the existing stack and access', 'Responsive layouts and clearer service information', 'A plan for preserving working URLs and redirecting moved pages', 'Checks of agreed pages, links and enquiry actions before launch'],
    evidence: 'This portfolio has been improved while retaining its 3D identity: essential content is prerendered, mobile rendering quality adapts, and direct contact options remain available.',
    faqs: [
      ['Can you improve my existing React website?', 'Yes, subject to reviewing the source and requirements. Share the current URL and the problems you want to solve.'],
      ['My site is on WordPress. Can you work on it?', 'Share the URL and explain the change first. I will confirm whether I can deliver it before quoting; WordPress-specific development is not an advertised capability here.'],
      ['Will existing links keep working?', 'Preserving useful URLs is part of the review. If pages need to move, we plan redirects and check them after deployment.'],
      ['Is ongoing maintenance included?', 'Any maintenance, hosting responsibilities or support arrangement must be discussed and included in the agreed scope.'],
    ],
  },
];
