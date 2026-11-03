# Fazhere — Built to Fit

Muhammed Favas K’s React, Vite and Three.js portfolio at https://fazhere.com. The first screen includes an ordinary link to the featured project and another to the enquiry. The product demo uses real, locally hosted COITONIC front photographs. Pull the orange rail or use its arrow keys, Home and End. The layout presets and enlargement work independently of WebGL.

## Development and review

Use Node 22.12 or later. Run `npm ci`, `npm run dev` and `npm run verify`. Verification runs tests, builds and prerenders the routes and checks links, metadata and the initial JavaScript budget. To open the review offline, run `node scripts/build-fit-preview.mjs` after verification and open the HTML in `visual-checks/`. PR browser checks attach the preview, opening recording, screenshots and same-run comparison with the base commit.

Homepage composition lives in `src/App.jsx`. The sample and pointer/keyboard controls are in `src/fit/ProductBench.jsx`. The deferred Three.js rails in `src/fit/rails.js` draw during the light cue and on resize. Static CSS rails in `fit.css` support reduced motion, invisible scenes and context loss. Edit the 1.4-second cue in both files together. Other chapters live in `Chapters.jsx`. Identity and project claims come from `src/data/portfolio.js`. Services, process stages and contact destinations come from `src/data/site.js`.

## Evidence for the sample

The live [COITONIC product](https://www.gymdrobe.com/product/6ad2351ed8f991271e3d1a8b) displayed different front photos for black and red. Both offered S, M, L and XL. Switching black/M to red and back retained M. The collection card also changed the image. See the [product detail](https://github.com/favas5291-coder/gym-store/blob/935e09add8383cfa104379f83e002ed3b0834b8f/src/pages/ProductPage.jsx) and [collection card](https://github.com/favas5291-coder/gym-store/blob/935e09add8383cfa104379f83e002ed3b0834b8f/src/components/ProductCard.jsx). The local demo reproduces this subset with one mounted component and container-responsive layout. Its sizes are a verified snapshot. The purchase link opens the live product. No payment, order or enquiry was submitted. The timeout example is based on [frontend payment handling](https://github.com/favas5291-coder/gym-store/blob/935e09add8383cfa104379f83e002ed3b0834b8f/src/services/paymentApi.js).

## Five-second phone test

Show the opening silently for five seconds, then hide it. Ask “What does Favas build?”, “Which project did you see?” and “How would you contact him?” Let the person explore without coaching. Ask “What changed when you chose a colour and resized?” Finish with “What would you hire Favas to build, and what gave you confidence?” Record their words only after a real session.

## Refresh project previews

Project previews are registered in `src/data/project-previews.js`. The homepage, enlargement dialog, services pages and case study share the same screenshot. Capture dates remain separate from code-review dates.

Inspect the actual public homepage, dismiss optional overlays, wait for visible images/fonts, and capture a clean desktop screenshot at 1348 × 926 or larger with the same aspect ratio. Confirm that it shows the current design rather than a login, error, popup or loading state.

```sh
npm run preview:update -- gymdrobe /absolute/path/to/capture.jpg 2026-10-30T12:00:00Z
npm run verify
```

The helper validates the capture, generates optimized WebP with a content-based filename, preserves the last good preview on invalid input and skips identical output. Commit the new image and manifest together. The linked daily preview automation checks for meaningful design changes, ignoring ordinary video-frame, price and inventory changes. It preserves project copy and code-review dates.

Only add verified projects and working links. The current selected project is GymDrobe. A separately verified portrait capture can be published with the same command and a trailing `mobile` argument. A desktop update automatically hides the previous portrait until its matching version has been verified. The product sample photos are independent of the homepage captures.
