# Fazhere Studio · Variable Width

A scroll-guided visit to Muhammed Favas K’s software practice in Kozhikode, Kerala. Scroll from the studio entrance to the GymDrobe projection, try the responsive storefront, compare two proposed mobile layouts, and start a project brief.

## Run and verify

Use Node 22.12 or later. Install the locked dependencies with `npm ci`. Run `npm run dev` for development. Run `npm run verify` for the unit tests, production build, prerendered pages, internal links, metadata, and initial JavaScript budget. Run `npm run preview` to serve the generated site.

The visual review workflow exercises the production build in Chromium and WebKit. For a portable preview, run `node scripts/build-fit-preview.mjs visual-checks/variable-width-preview.tar.gz` after building. Extract the archive and run `node serve.mjs` inside it.

## Maintain the visit

- The homepage and native scroll choreography live in `src/App.jsx`. The primary links are `/#work`, `/#process`, and `/#contact`. Production renders the opening image, title, offer, and direct contact links into HTML.
- The instrument and its camera live in `src/variable/`. To regenerate its WebP stills, install the Playwright tooling named in the visual review workflow and run `node scripts/render-variable-views.mjs`. Set `CHROME_PATH` if using system Chromium.
- The working storefront and design review live in `src/variable/Exhibit.jsx` and `Process.jsx`. The verified business and project facts, project imagery, and contact destinations come from `src/data/`.
- Geometry and the HTML exhibit share a width value. Check both ends of travel, both viewports, and the vertical scroll gesture after changing the instrument. Also test the same tasks in still mode.
- Public routes are prerendered into `dist`. The production site uses the existing Render service for https://fazhere.com. Run `node scripts/check-deployment.mjs https://fazhere.com` after a release to check public pages, redirects, and crawl information.

## Refresh project previews

Project previews are registered in `src/data/project-previews.js`. The storefront capture appears on the case-study and service pages. The exhibit uses the registered product imagery. Capture dates remain separate from code-review dates.

Inspect the actual public homepage, dismiss optional overlays, wait for visible images/fonts, and capture a clean desktop screenshot at 1348 × 926 or larger with the same aspect ratio. Confirm that it shows the current design rather than a login, error, popup or loading state.

```sh
npm run preview:update -- gymdrobe /absolute/path/to/capture.jpg 2026-10-30T12:00:00Z
npm run verify
```

The helper validates the capture, generates optimized WebP with a content-based filename, preserves the last good preview on invalid input and skips identical output. Commit the new image and manifest together. The linked daily preview automation checks for meaningful design changes, ignoring ordinary video-frame, price and inventory changes. It preserves project copy and code-review dates.

Only add verified projects and working links. The current projects are GymDrobe, Everyday Luxvibe and FABEA. The latter two are independent storefront concepts. A separately verified portrait capture can be published with the same command and a trailing `mobile` argument. A desktop update automatically hides the previous portrait until its matching version has been verified. The product sample photos are independent of the homepage captures.
