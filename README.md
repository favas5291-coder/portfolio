# Favas — a personal developer studio

React 19 + Vite portfolio for Muhammed Favas K at https://fazhere.com. The homepage presents real services and GymDrobe work through an optional guided tour. Existing service, contact, privacy and case-study routes remain prerendered with their existing SEO metadata.

## Run and verify

Requires Node 22.12 or later.

```sh
npm ci
npm run dev
npm run verify
```

`verify` runs the tests, production build, prerendering and static page/link/metadata checks. Deploy the `dist` directory using the existing Vercel configuration. The deferred character chunk does not block essential page content.

## Guided experience

- Visitor-activated browser speech with readable captions. Nothing speaks automatically on arrival.
- Welcome → services → real work → collaboration process → contact.
- Play/pause, sound, previous/next, chapter selection, skip, project inspection and replay.
- Session-scoped introduction dismissal; keyboard controls, reduced motion, hidden-tab pause and a static character fallback.
- No paid speech service, voice API key, account login or additional visitor app is required. Browser voice quality and availability vary.

The animated character is a **temporary procedural rig**. The static portrait is a reference-inspired generated concept. Neither represents a finished custom rigged likeness. No actual phoneme lip synchronization or cloned voice is claimed.

See [docs/GUIDED-PORTFOLIO.md](docs/GUIDED-PORTFOLIO.md) for configuration, asset integration, limitations and verification details.

## Update content

| Content | Source |
| --- | --- |
| Identity, contact destinations, skills and current project | `src/data/portfolio.js` |
| Service descriptions, routes, WhatsApp and collaboration stages | `src/data/site.js` |
| Tour targets, narration, optional audio references, actions, highlights and character model | `src/guide/tourConfig.js` |
| Shared project screenshot and capture date | `src/data/project-previews.js` |
| Main layout and styles | `src/App.jsx`, `src/studio.css` |

Narration is editable text. Browser speech reads the latest text without regenerating audio. Optional prerecorded clips may later be placed in `public/audio/tour/` and referenced by a narration segment's `audio` field.

## Refresh project previews

Project previews are registered in `src/data/project-previews.js`. The homepage, enlargement dialog, services pages and case study share the same screenshot. Capture dates remain separate from code-review dates.

Inspect the actual public homepage, dismiss optional overlays, wait for visible images/fonts, and capture a clean desktop screenshot at 1348 × 926 or larger with the same aspect ratio. Confirm that it shows the current design rather than a login, error, popup or loading state.

```sh
npm run preview:update -- gymdrobe /absolute/path/to/capture.jpg 2026-10-30T12:00:00Z
npm run verify
```

The helper validates the capture, generates optimized WebP with a content-based filename, preserves the last good preview on invalid input and skips identical output. Commit the new image and manifest together. The linked daily preview automation checks for meaningful design changes, ignoring ordinary video-frame, price and inventory changes. It preserves project copy and code-review dates.

Only add verified projects and working links. New project cards and their optional tour steps should be added together; the current site has one selected project, GymDrobe.
