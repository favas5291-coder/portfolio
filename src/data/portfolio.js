import { projectPreviews } from './project-previews.js';

const preview = projectPreviews.gymdrobe;
// All personal and project copy lives here. Empty optional destinations stay hidden.
export const profile = {
  name: 'Muhammed Favas K',
  displayName: ['Muhammed', 'Favas '],
  shortName: 'Favas',
  signature: 'Favas .',
  role: 'MERN Stack / Full Stack Developer',
  location: 'Kozhikode, Kerala, India',
  email: 'favas5291@gmail.com',
  github: 'https://github.com/favas5291-coder',
  linkedin: 'https://www.linkedin.com/in/muhammed-favas-2aa4b03aa',
  cv: '',
  headline: 'Freelance Web Developer in Kozhikode — Websites Built for Your Business.',
  intro: 'I’m Favas. I build business websites, online stores and landing pages that make your offer clear and help customers contact you. Based in Calicut, Kerala; available for remote projects across India.',
  aboutTitle: ['Good ideas.', 'Built to work.'],
  about: 'I’m Favas, a full stack developer based in Kozhikode, Kerala. I work with JavaScript, React, Node.js, Express and MongoDB.',
  approach: 'My work connects what people see with what happens behind it. GymDrobe puts that into practice: products, accounts, shopping and checkout in one connected experience.',
  contactTitle: ['Have an idea?', 'Let’s build it.'],
  contactIntro: 'Tell me what you want to make. Let’s work out how to build it.',
};

export const chapters = [
  { id: 'home', label: 'Home', number: '00', title: 'The assembly' },
  { id: 'about', label: 'About', number: '01', title: 'Behind the build' },
  { id: 'skills', label: 'Skills', number: '02', title: 'The working parts' },
  { id: 'projects', label: 'Projects', number: '03', title: 'Built & shipped' },
  { id: 'contact', label: 'Contact', number: '04', title: 'What comes next' },
];

export const skillGroups = [
  { name: 'Frontend', description: 'Interfaces, interactions and the state that connects them.' },
  { name: 'Backend', description: 'Application logic and the APIs behind the interface.' },
  { name: 'Database', description: 'Structured data for products, accounts and orders.' },
  { name: 'Tools', description: 'Version control and source code that can be reviewed.' },
];
export const skills = [
  { name: 'JavaScript', label: 'JS', group: 'Frontend', detail: 'Product selection, cart logic and asynchronous checkout states.', file: 'src/context/StoreContext.jsx' },
  { name: 'React', label: 'React', group: 'Frontend', detail: 'Reusable interfaces and shared shopping state in GymDrobe.', file: 'src/pages/ProductPage.jsx' },
  { name: 'Tailwind CSS', label: 'Tailwind', group: 'Frontend', detail: 'Responsive layouts and consistent styling in this portfolio.' },
  { name: 'Node.js', label: 'Node', group: 'Backend', detail: 'JavaScript on the server; part of the supplied GymDrobe MERN stack.' },
  { name: 'Express', label: 'Express', group: 'Backend', detail: 'Routing and API logic in the supplied GymDrobe backend stack.' },
  { name: 'MongoDB', label: 'MongoDB', group: 'Database', detail: 'Document-based storage in the supplied GymDrobe stack.' },
  { name: 'Git', label: 'Git', group: 'Tools', detail: 'Track changes and keep the development history reviewable.' },
  { name: 'GitHub', label: 'GitHub', group: 'Tools', detail: 'Publish the GymDrobe source for others to inspect.', file: '' },
];

export const project = {
  name: 'GymDrobe',
  category: 'Fitness e-commerce',
  tagline: 'One store. Every workout.',
  description: 'A fitness e-commerce platform that brings clothing, supplements and accessories from different brands into one store.',
  website: 'https://gymdrobe.com',
  repository: 'https://github.com/favas5291-coder/gym-store',
  commit: '74bb08e8b32957581aeef46ad400cd0b01c73858',
  reviewed: '22 October 2026',
  screenshot: preview.screenshot,
  screenshotCaptured: new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(new Date(preview.capturedAt)),
  screenshotAlt: 'The real GymDrobe homepage, with fitness product navigation and its workout clothing collection.',
  stack: ['JavaScript', 'React', 'Node.js', 'Express', 'MongoDB', 'Tailwind CSS'],
  features: ['Product variants', 'Cart', 'Wishlist', 'Authentication', 'Checkout', 'Razorpay payments', 'Orders', 'Admin management'],
  problem: 'Workout essentials are spread across different stores. GymDrobe brings clothing, supplements and accessories together, with a connected path from product selection to checkout.',
  role: 'Full stack development',
  tourNarration: 'GymDrobe brings workout essentials into one fitness store. I built its storefront, product selection and shopping flow, connecting the interface with checkout and order management. Take a closer look whenever you like.',
  contribution: 'The storefront, product selection and shopping flow: React components, cart and wishlist state, authentication integration, checkout, payment integration and order-management interfaces.',
  decisions: [
    { title: 'One variant, all the way through.', challenge: 'A colour change can affect the image, available sizes and stock.', decision: 'Connect the product gallery to the selected colour, and validate size, colour and stock together.', takeaway: 'Treat the selected variant as part of the product’s identity.', file: 'src/pages/ProductPage.jsx' },
    { title: 'Keep shopping state in its place.', challenge: 'Guests and signed-in customers need a consistent shopping flow.', decision: 'Separate account state, preserve guest selections and handle the transition during authentication.', takeaway: 'Account changes and page refreshes belong in the design from the start.', file: 'src/context/StoreContext.jsx' },
    { title: 'Handle the uncertain payment.', challenge: 'A network timeout does not prove that a payment failed.', decision: 'Share matching in-flight requests and tell customers to check their order before trying an unconfirmed payment again.', takeaway: 'Make uncertainty clear before asking someone to pay twice.', file: 'src/services/paymentApi.js' },
  ],
  evidence: 'Source and public storefront reviewed on 22 October 2026. Frontend flows and API clients were inspected. Live payments, admin permissions and the complete commerce backend were not tested end to end. Backend stack and feature scope are supplied project information; the decisions above reflect the inspected frontend code.',
};

// Camera keyframes: x, y, z. The scroll engine interpolates between chapters.
export const cameraTimeline = [
  { camera: [0, 1, 8], target: [0, 0, 0], object: [1.65, -0.05, 0], rotation: [0.22, -0.4, -0.3], spread: 0 },
  { camera: [2, 0.5, 5], target: [0, 0, 0], object: [-1.55, 0, 0], rotation: [0.5, 0.35, 0.5], spread: 0.85 },
  { camera: [-2, 1, 6], target: [0, 0, 0], object: [-1.4, 0, 0], rotation: [0.1, -0.15, 0.1], spread: 1.35 },
  { camera: [0, 0.5, 6], target: [0, 0, 0], object: [1.7, 0.2, 0], rotation: [0, -0.12, 0], spread: 0.15 },
  { camera: [0, 1.5, 9], target: [0, 0, 0], object: [2, -0.1, 0], rotation: [0.2, -0.45, -0.25], spread: 0 },
];
