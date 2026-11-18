# Fazhere Editions

Muhammed Favas K’s React, Vite and Three.js portfolio at https://fazhere.com. A proof press prints real storefront captures. Turn the paper using its corner or the **Turn the proof** button to see a decision behind each build. WhatsApp and case studies have ordinary links in the first HTML response.

## Run and review

Use Node 22.12 or later. Run `npm ci`, `npm run dev` and `npm run verify`. Verification tests the project, prerenders the routes and checks links, metadata and initial JavaScript budgets. For a portable review, run `node scripts/build-fit-preview.mjs` after building and open `visual-checks/Fazhere-Editions-Preview.html`. The PR browser workflow checks desktop and emulated touch layouts and produces the screenshots, opening recording and a same-condition comparison against its base.

## Maintain the edition

- **Projects.** Keep claims and destinations in `src/data/portfolio.js`. In `src/editions/evidence.js`, associate each displayed project with its shared preview ID, disclosure and a specific front-end decision. The press, index and case studies use the preview manifest. A refreshed desktop capture automatically retires the old portrait pairing until a matching portrait has been verified.
- **Motion.** `src/editions/PressScene.js` runs the roller travel, final paper advance, corner lift and page deformation. `pressHardware.js` owns the castings, steel roller and orange crank. `ProofPress.jsx` owns pointer/keyboard input, release timing and focus. The scene yields to the HTML at rest and pauses outside the viewport or in a hidden tab. The CSS illustration and HTML controls run without WebGL. Reduced motion skips the renderer and shows the chosen face directly.
- **Business information.** Service names, prices where applicable, process stages and contact destinations come from `src/data/site.js`. The brief selector prefills the existing enquiry and the visitor’s WhatsApp draft.
- **Routes.** `#projects` leads to the project index. `#proof-gymdrobe`, `#proof-luxvibe` and `#proof-fabea` load an edition on the press. All case studies and standalone demos retain their own routes.

## Evidence on the reverse

- **GymDrobe.** On the [COITONIC product](https://www.gymdrobe.com/product/6ad2351ed8f991271e3d1a8b), choosing red after black/M changed the main photo and thumbnails and retained M. Both colours exposed S, M, L and XL at inspection. The reverse shows the local colour photographs at that selected size. [Product selection source](https://github.com/favas5291-coder/gym-store/blob/68e58f8d8668492f189776d31b8f7299f0ff7ac3/src/pages/ProductPage.jsx#L174-L245).
- **Luxvibe.** The [sample boutique](https://fazhere.com/demos/luxvibe/) carried the Classic Dial in M/L, its finish and quantity into the enquiry preview. See `enquiryMessage` in `public/demos/luxvibe/core.js`.
- **FABEA.** The [sample product](https://fazhere.com/demos/fabea/#/product/the-arc-top-handle) confirmed copying an enquiry. The product reference, colour, quantity and link come from `enquiryText` in `demos/fabea/catalogue.ts`. Both boutique editions use sample goods and generated photography.

## Five-second phone review

Show the opening silently for five seconds. Hide it and ask “Who is this, what does he build, and where would you contact him?” Give the phone back and let the visitor turn the proof independently. Ask “What did you learn about his work that you couldn’t tell from the screenshot alone?” Record their answers only after a real session.

## Refresh project previews

Project previews are registered in `src/data/project-previews.js`. The homepage, enlargement dialog, services pages and case study share the same screenshot. Capture dates remain separate from code-review dates.

Inspect the actual public homepage, dismiss optional overlays, wait for visible images/fonts, and capture a clean desktop screenshot at 1348 × 926 or larger with the same aspect ratio. Confirm that it shows the current design rather than a login, error, popup or loading state.

```sh
npm run preview:update -- gymdrobe /absolute/path/to/capture.jpg 2026-10-30T12:00:00Z
npm run verify
```

The helper validates the capture, generates optimized WebP with a content-based filename, preserves the last good preview on invalid input and skips identical output. Commit the new image and manifest together. The linked daily preview automation checks for meaningful design changes, ignoring ordinary video-frame, price and inventory changes. It preserves project copy and code-review dates.

Only add verified projects and working links. The press currently displays GymDrobe and the independently labelled Luxvibe and FABEA concepts. A separately verified portrait capture can be published with the same command and a trailing `mobile` argument. A desktop update automatically hides the previous portrait until its matching version has been verified. The product sample photos are independent of the homepage captures.
