import { profile, project } from '../data/portfolio.js';
import { services, processSteps } from '../data/site.js';

export const characterAsset = {
  status: 'temporary',
  model: null,
  animations: { idle: 'Idle', wave: 'Wave', present: 'Present', point: 'Point', turn: 'Turn', welcome: 'Welcome' },
  portrait: '/characters/favas-character.webp',
  label: 'Character preview',
  description: 'Temporary animated character. A custom likeness model and facial rig are still in production.',
};

// Add a reusable audio URL to a segment to replace browser speech. durationMs
// is the captions-only reading duration; a real audio clip drives its own end.
const segment = (text, durationMs, audio = null) => ({ text, durationMs, audio });
const serviceLines = [
  'My business websites put services and contact details within easy reach.',
  'My e-commerce development connects product choices with a shopping bag.',
  'My landing pages give one offer a clear enquiry action.',
  'A website redesign makes an existing site easier to navigate.',
];
const processLines = [
  'We discuss your customers and write a brief.',
  'You receive the scope and quote.',
  'I build a preview you can try.',
  'We review the important journeys together.',
  'After approval, I launch and hand over the site.',
];
export const tourSteps = [
  {id:'welcome',title:'Welcome',target:'home',highlight:'welcome-copy',action:'wave',settledAction:'point',
    segments:[segment("Hi, I’m Favas. Come in. This is GymDrobe, an online store I built. Let me show you how it works.",8800)]},
  {id:'services',title:'Services',target:'services',highlight:'services-list',action:'present',
    segments:services.map((service,index)=>({...segment(serviceLines[index] ?? service.short,3700),service:index,highlight:'service-choice-'+index}))},
  {id:'projects',title:'Projects',target:'projects',highlight:'project-preview',action:'point',
    segments:[segment(project.tourNarration,12400)],inspect:{label:'Explore '+project.name,href:project.website}},
  {id:'process',title:'Process',target:'process',highlight:'process-list',action:'present',
    segments:processSteps.map(([name,detail],index)=>({...segment(processLines[index] ?? detail,3000),stage:index}))},
  {id:'contact',title:'Contact',target:'contact',highlight:'contact-options',action:'invite',
    segments:[segment("Have a project in mind? Tell me what you’re planning, and let’s discuss how I can help. You can reach me by WhatsApp, email or the enquiry form.",11500)]},
];
export const tourDurationSeconds = Math.round(tourSteps.flatMap(step => step.segments).reduce((sum, s) => sum + s.durationMs, 0) / 1000);
export const tourAuthor = profile.shortName;
export const collaborationSteps = processSteps;

export const initialTour = { status: 'idle', index: 0, segment: 0, sound: true, blocked: false, run: 0 };
export function tourReducer(state, event) {
  const max = tourSteps.length - 1;
  switch (event.type) {
    case 'START': return { ...initialTour, status: 'playing', sound: event.sound ?? true, run: state.run + 1 };
    case 'PAUSE': return state.status === 'playing' ? { ...state, status: 'paused' } : state;
    case 'PLAY': return { ...state, status: 'playing', blocked: false };
    case 'SOUND': return { ...state, sound: !state.sound, blocked: false };
    case 'BLOCKED': return { ...state, sound: false, blocked: true };
    case 'RETRY_SOUND': return { ...state, sound: true, blocked: false, run: state.run + 1 };
    case 'SKIP': return { ...state, status: 'idle', blocked: false };
    case 'SELECT': return { ...state, index: Math.max(0, Math.min(max, event.index)), segment: 0, blocked: false };
    case 'PREVIOUS': return { ...state, index: Math.max(0, state.index - 1), segment: 0, blocked: false };
    case 'NEXT': return state.index < max ? { ...state, index: state.index + 1, segment: 0, blocked: false } : { ...state, status: 'completed' };
    case 'SEGMENT_END': {
      const nextSegment = state.segment + 1;
      if (nextSegment < tourSteps[state.index].segments.length) return { ...state, segment: nextSegment };
      return state.index < max ? { ...state, index: state.index + 1, segment: 0, blocked: false } : { ...state, status: 'completed' };
    }
    default: return state;
  }
}
