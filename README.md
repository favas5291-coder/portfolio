# Fazhere Afterlight

A playable Kozhikode night harbour for Muhammed Favas K at https://fazhere.com. Built in React 19, Vite and Three.js. Normal links, contact actions and routes are prerendered.

## Run and verify

Requires Node 22.12 or later.

```sh
npm ci
npm run dev
npm run verify
```

`verify` runs the tests, production build, prerendering and static page/link/metadata checks. Deploy the `dist` directory using the existing Vercel configuration. The deferred harbour renderer does not block essential page content.

## The harbour

Drag the brass dial or use the arrow keys to direct the beam. Enter visits the illuminated berth. Three direct links and normal scrolling also work. A fishing boat signals back when the buoy catches the beam. The scene loads after the initial HTML, moves a single renderer between views and rests offscreen or in a hidden tab. Reduced motion and unavailable WebGL use an illustrated chart. Sound is off; the experience is silent.

The homepage lives in `src/App.jsx`. The models, camera, shaders, chart and styles are in `src/afterlight/`. Destination dial positions are in `bearings.js`. Identity and verified work live in `src/data/portfolio.js`, services, process and WhatsApp in `src/data/site.js`. Service choices use a validated slug to prefill the existing enquiry.

## Refresh project previews

Project previews are registered in `src/data/project-previews.js`. The homepage, enlargement dialog, services pages and case study share the same screenshot. Capture dates remain separate from code-review dates.

Inspect the actual public homepage, dismiss optional overlays, wait for visible images/fonts, and capture a clean desktop screenshot at 1348 × 926 or larger with the same aspect ratio. Confirm that it shows the current design rather than a login, error, popup or loading state.

```sh
npm run preview:update -- gymdrobe /absolute/path/to/capture.jpg 2026-10-30T12:00:00Z
npm run verify
```

The helper validates the capture, generates optimized WebP with a content-based filename, preserves the last good preview on invalid input and skips identical output. Commit the new image and manifest together. The linked daily preview automation checks for meaningful design changes, ignoring ordinary video-frame, price and inventory changes. It preserves project copy and code-review dates.

Only add verified projects and working links. The current selected project is GymDrobe. A separately verified portrait capture can be published with the same command and a trailing `mobile` argument. A desktop update automatically hides the previous portrait until its matching version has been verified. The local swatch demo uses the store’s actual COITONIC shirt photos and links to the verified product-card implementation.
