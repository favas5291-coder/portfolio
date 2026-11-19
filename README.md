# Fazhere Studio

Muhammed Favas K’s React, Vite and Three.js portfolio. Visitors scroll from a shaded entrance through a virtual software studio in Kozhikode, ending at the founder’s desk. The people in the office illustrate how a project moves through development and review.

## Run and verify

Use Node 22.12 or later. Run `npm ci`, then `npm run dev` for development. Run `npm run verify` for the unit tests, production build, prerendered routes, internal links, SEO and initial JavaScript budget. `npm run preview` serves that build.

The **Fazhere Studio visual review** workflow runs the built site in desktop Chromium and phone-size WebKit. The artifact contains screenshots and lab measurements in `review.json`. Its workflow file lists the Playwright installation commands for reproducing the run locally. With the built preview running, run `node scripts/review-studio.mjs`. Set `PREVIEW_URL` or `REVIEW_OUTPUT` to choose a different origin or output directory.

## Explore and maintain the studio

- Scroll in either direction, choose **Jump to a room**, or use a room’s direct link. The six anchors are `#entrance`, `#reception`, `#project-room`, `#development-studio`, `#client-review` and `#founder-office`. Essential content and contact links are prerendered. Reduced motion, disabled WebGL and paused animation use individual room stills. If the renderer repeatedly exceeds 100 ms per frame after reducing resolution, the tour switches to those same stills. “Resume 3D” lets the visitor opt back in. Ambient sound starts only on request.
- GymDrobe’s product example uses the supplied black and red COITONIC photos. Case studies open in native dialogs and the Back button returns visitors to their place. Without JavaScript these links open the ordinary case-study pages. FABEA and Luxvibe remain independent storefront concepts.
- The scroll layout, directory and legacy section aliases live in `src/App.jsx`; camera eye and target points are in `src/studio/cameraPath.js`. Update `buildOffice.js`, office geometry and `officePeople.js` together when moving a desk, actor or doorway. Inspect all six stops at desktop and phone aspect ratios for sightlines and clearance.
- Update room copy, examples and exhibit links in `src/studio/RoomContent.jsx` and `studioContent.js`. Services and the WhatsApp destination come from `src/data/site.js`; project facts and email come from `src/data/portfolio.js`. Project exhibits use the shared preview manifest below.
- The still images use the six room anchors as filenames under `public/studio/`. After a scene or camera change, use `node scripts/render-studio-stills.mjs` with the optional review browser tools installed. Set `CHROME_PATH` if using a custom Chromium executable. Check each resulting WebP with reduced motion enabled. Keep the reviewed desktop/mobile walkthrough evidence separate from these fallback assets.
- For a phone acceptance check, ask a first-time visitor who Favas is, what he built, and how to discuss a project. Observe a forward and reverse scroll, a project close, and the handoff to WhatsApp. Browser emulation checks layout and interactions; a hands-on device session assesses comfort and clarity.

## Refresh project previews

Project previews are registered in `src/data/project-previews.js`. The homepage, enlargement dialog, services pages and case study share the same screenshot. Capture dates remain separate from code-review dates.

Inspect the actual public homepage, dismiss optional overlays, wait for visible images/fonts, and capture a clean desktop screenshot at 1348 × 926 or larger with the same aspect ratio. Confirm that it shows the current design rather than a login, error, popup or loading state.

```sh
npm run preview:update -- gymdrobe /absolute/path/to/capture.jpg 2026-10-30T12:00:00Z
npm run verify
```

The helper validates the capture, generates optimized WebP with a content-based filename, preserves the last good preview on invalid input and skips identical output. Commit the new image and manifest together. The linked daily preview automation checks for meaningful design changes, ignoring ordinary video-frame, price and inventory changes. It preserves project copy and code-review dates.

Only add verified projects and working links. The current projects are GymDrobe, Everyday Luxvibe and FABEA. The latter two are independent storefront concepts. A separately verified portrait capture can be published with the same command and a trailing `mobile` argument. A desktop update automatically hides the previous portrait until its matching version has been verified. The product sample photos are independent of the homepage captures.
