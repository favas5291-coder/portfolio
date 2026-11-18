import { fabea, luxvibe, project } from '../data/portfolio.js';

// Fronts use projectPreviews[id]. The reverse records a specific observed
// interaction, independent of the date of the homepage photograph.
export const editions = [
  {
    id: 'gymdrobe',
    name: project.name,
    category: project.category,
    disclosure: 'A store I founded and built.',
    caseStudy: '/projects/gymdrobe/',
    live: project.website,
    source: project.repository,
    decision: 'The colour changes. Your size carries over.',
    impact: 'I connected the gallery to the selected colour. On this COITONIC shirt, switching from black to red shows the red photos and keeps the available size M selected.',
    detail: {
      label: 'COITONIC · Compression Half Sleeves T-shirt',
      lines: ['Black / M', 'Red / M'],
      images: [
        { src: '/images/projects/gymdrobe-shirt-black.webp', alt: 'COITONIC shirt in black', label: 'Black' },
        { src: '/images/projects/gymdrobe-shirt-red.webp', alt: 'The same COITONIC shirt in red', label: 'Red' },
      ],
      href: 'https://www.gymdrobe.com/product/6ad2351ed8f991271e3d1a8b',
      linkLabel: 'Try the live product',
    },
  },
  {
    id: 'luxvibe',
    name: luxvibe.name,
    category: luxvibe.category,
    disclosure: 'Independent concept with sample products and generated photography.',
    caseStudy: luxvibe.caseStudy,
    live: luxvibe.demo,
    decision: 'The strap size travels with the enquiry.',
    impact: 'I carried each chosen option from the product page into a sample WhatsApp message. A shopper can review the exact watch, strap size and quantity before a conversation.',
    detail: {
      label: 'From the demo enquiry',
      lines: ['The Classic Dial', 'Option: M/L', 'Colour: Brown / gold-tone', 'Quantity: 1'],
      href: luxvibe.demo + '#/product/classic-dial',
      linkLabel: 'Try the sample enquiry',
    },
  },
  {
    id: 'fabea',
    name: fabea.name,
    category: fabea.category,
    disclosure: 'Independent storefront concept with sample products and generated photography.',
    caseStudy: fabea.caseStudy,
    live: fabea.demo,
    decision: 'A shopper can ask for the exact piece.',
    impact: 'I gave each style a reference and included it in the copyable enquiry, alongside the colour and product link. The boutique can see exactly which bag the shopper means.',
    detail: {
      label: 'From the sample product enquiry',
      lines: ['The Arc · DEMO-B01', 'Colour: Chocolate | Quantity: 1', 'Price on request'],
      href: fabea.demo + '#/product/the-arc-top-handle',
      linkLabel: 'Try the sample product',
    },
  },
];
