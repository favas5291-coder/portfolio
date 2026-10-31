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
export const tourSteps = [
  {
    id: 'welcome', title: 'A personal hello', target: 'home', highlight: 'welcome-copy', action: 'wave',
    segments: [segment("Hey! I'm Favas. Welcome to my creative world. I build websites and applications that help businesses grow. Come on, let me show you what I can create.", 9500)],
  },
  {
    id: 'services', title: 'What I can build', target: 'services', highlight: 'services-list', action: 'present',
    segments: [segment(`I help with ${services.map(service => service.name.toLowerCase()).join(', ')}. We choose the right scope for your business and customers.`, 11000)],
  },
  {
    id: 'projects', title: 'A real project', target: 'projects', highlight: 'project-preview', action: 'point',
    segments: [segment(project.tourNarration, 15000)],
    inspect: { label: `Explore ${project.name}`, href: project.website },
  },
  {
    id: 'process', title: 'Working together', target: 'process', highlight: 'process-list', action: 'present',
    segments: [segment(`We start by discussing your requirements, then agree the scope and quote. Design and development come next. We review the important journeys together, then launch and hand over your project.`, 14000)],
  },
  {
    id: 'contact', title: 'Your next chapter', target: 'contact', highlight: 'contact-options', action: 'welcome',
    segments: [segment("Now you've seen a little of what I can create. Have a project in mind? Let's build something incredible together. Reach me through WhatsApp, phone or email.", 11500)],
  },
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
    case 'BLOCKED': return { ...state, status: 'paused', blocked: true };
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
