import { fabea, luxvibe, profile, project } from '../data/portfolio.js';
import { projectPreviews } from '../data/project-previews.js';
import { whatsappHref } from '../data/site.js';

export const tourWhatsapp = whatsappHref('Hi Favas, I visited your studio. I’d like to discuss a project.');
export const tourEmail = 'mailto:' + profile.email;

export const exhibits = {
  gymdrobe: {
    name: project.name,
    role: 'Founder and full-stack developer',
    summary:
      'Workout clothing and equipment, with a single shopping journey from product choice to checkout.',
    contribution:
      'I built the React storefront, product selection, cart, checkout and order-management interfaces.',
    preview: projectPreviews.gymdrobe,
    live: project.website,
    page: '/projects/gymdrobe/',
  },
  fabea: {
    name: fabea.name,
    role: fabea.status,
    summary: fabea.description,
    contribution: fabea.contribution,
    preview: projectPreviews.fabea,
    live: fabea.demo,
    page: fabea.caseStudy,
  },
  luxvibe: {
    name: luxvibe.name,
    role: luxvibe.status,
    summary: luxvibe.description,
    contribution: luxvibe.contribution,
    preview: projectPreviews.luxvibe,
    live: luxvibe.demo,
    page: luxvibe.caseStudy,
  },
};

export const shopColours = [
  { name: 'Black', tone: '#242725', photo: '/images/projects/gymdrobe-shirt-black.webp' },
  { name: 'Red', tone: '#a63034', photo: '/images/projects/gymdrobe-shirt-red.webp' },
];

export const projectStages = [
  [
    'Brief',
    'Tell me how customers choose a size, colour and product. We agree which parts of that journey belong in the first release.',
  ],
  [
    'Design',
    'Review the product page on a phone. Check where the colour choices sit and how the image changes before I build the flow.',
  ],
  [
    'Build',
    'Try a working preview. Pick red, choose a size and add the shirt to the bag. Read the selection back from the bag.',
  ],
  [
    'Test',
    'Check the agreed journeys together, including switching colours and trying an unavailable size. Record anything that needs a fix.',
  ],
  [
    'Handover',
    'Approve the release, then receive the agreed access and project information for running the store.',
  ],
];

export const clientQuestions = [
  [
    'What should I bring?',
    'A link to your current site or Instagram, who you want to reach and one thing your customers need to do. An early idea is enough for the first conversation.',
  ],
  [
    'How do we agree on scope?',
    'We write down the pages, features and responsibilities, then agree on the quote before development begins.',
  ],
  [
    'How will I review progress?',
    'You check the agreed work in a preview. Before launch, we walk through the content, forms and key journeys together.',
  ],
];
