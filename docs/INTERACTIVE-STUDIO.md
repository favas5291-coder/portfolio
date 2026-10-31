# Interactive cartoon studio — implementation notes

This iteration extends the existing React + Vite portfolio at fazhere.com. It does not replace the source of truth for services, projects, SEO pages, or contact routes.

## Visitor experience

- A CSS-built sculpted studio environment sits behind the existing lazy-loaded 3D guide in the welcome scene.
- **Start tour with sound** still requires a visitor gesture. Tour narration and captions are authored in `src/guide/tourConfig.js`; browser speech playback remains in `src/guide/narration.js`.
- **Explore myself** continues to work without starting audio, and a chapter rail is available on large screens.
- The guide changes pose by chapter and can follow visitors unobtrusively on wide screens. On tablets and phones it stays out of the way of content.
- The service workbench uses the four genuine services from `src/data/site.js`. Interactive mini scenes are explicitly labeled **concept demonstrations** — they are not fabricated client projects.
- The process machine uses the five actual collaboration stages from `src/data/site.js`, with native buttons and readable descriptions regardless of motion support.
- GymDrobe's actual screenshot, contribution, source link, and case study remain in `src/data/portfolio.js`; the scheduled `src/data/project-previews.js` updater is untouched.

## How to update the experience

1. Update the real services and collaboration stages in `src/data/site.js`. The selection lists derive from these arrays.
2. If adding a new service, add a matching demo renderer to `src/experience/StudioInteractions.jsx` and its style in `studioInteractions.css`. Until then, the generic website demonstration remains the fallback.
3. Update GymDrobe's factual project description and destinations in `src/data/portfolio.js`, not in the demo code.
4. Edit the tour chapter targets, captions, audio references, gestures, and estimated durations in `src/guide/tourConfig.js`.
5. For real recorded narration, supply first-party clips under `public/audio/` and set each segment's optional audio path. Do not promise cloned speech or true viseme synchronization.
6. For a final likeness, export a licensed/owned, locally served glTF/GLB rig with wave/present/point/idle clips. Set `characterAsset.model` in `src/guide/tourConfig.js`. A moving portrait or the existing procedural rig is **not** the finished facial likeness.

## Quality and fallback

- The HTML content, direct contact actions, services, and project screenshot remain available if JavaScript, audio or WebGL fails.
- No new runtime packages, API keys, subscriptions or cloud animation services are required for this iteration.
- `npm run verify` runs unit tests, the Vite production build, prerender, and build checks. GitHub Actions runs it for this pull request.
- Still needed before a production claim: real-device iOS/Android audio and WebGL checks, keyboard and touch walkthroughs, browser screenshot review across widths, Lighthouse performance capture, and the final photo-matched character and viseme rig.
