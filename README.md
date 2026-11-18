# Fazhere Drive

Muhammed Favas K’s React, Vite and Three.js portfolio. Drive the orange pickup through a miniature Kozhikode neighbourhood or use the regular project, service and contact links. The initial HTML contains the identity, offer, GymDrobe and WhatsApp links, and a clickable illustrated map. The shared project manifest supplies the storefront images in both modes.

## Development and review

Use Node 22.12 or later. Run `npm ci`, `npm run dev` and `npm run verify`. Verification includes deterministic tests for steering, braking, prop impacts, suspension, ramp jumps and parking, plus the existing prerender, SEO, link and initial bundle checks.

The PR’s **Fazhere Drive visual review** workflow runs Chromium with touch emulation and software WebGL. Its downloadable artifacts include a self-contained HTML preview, production-build ZIP, screenshots, a recording and review.json. To create the offline preview locally, build first and run `node scripts/build-fit-preview.mjs`. Use the Vite preview or extracted production build to test real routes and both standalone boutique demos. In the offline preview, live store, public demo, contact and source links need an internet connection.

## Exploring and maintaining the neighbourhood

- Use WASD or arrow keys to drive and reverse, B to brake, Space to jump, Enter or E to inspect a nearby stop, M for the map, L for sound and R to recover. On a phone, steer and accelerate with one thumb. Hold Brake, then use the invitation to open a destination. The scene pauses while you read. Back or Escape returns to the same parking spot.
- The starting street, vehicle and collision geometry are original. The high camera, direct vehicle control and destination discovery draw on [Bruno Simon’s portfolio](https://bruno-simon.com/) and its [published update sequence](https://github.com/brunosimon/folio-2025). The implementation uses Three.js, instanced scene details and local procedurally synthesized sound. The artwork, map and audio for this neighbourhood were created for this site. Existing fonts retain their licence files in `public/fonts`.
- Change destination footprints, parking radii, spawn or delivery bay in `src/drive/layout.js`. Handling and collision response are in `simulation.js`, the pickup and moving prop meshes in `pickup.js`, the camera and optional audio in `engine.js`. The initial shop is built in `world.js`; scenery details load separately after the first frame. Keep the illustrated map and the collision bounds aligned when adding streets or landmarks.
- On a software renderer, the fixed-bearing camera can reuse the colour and depth of the static street. The pickup, movable objects, shutters, awning and leaf still move live. The cache is rebuilt as project textures arrive. The ramp and rear camera turn use the live scene. Hardware rendering uses the full scene throughout.
- Update the HTML introduction and overlays in `src/App.jsx`. Project descriptions and source links come from `src/data/portfolio.js`, services and contact destinations from `src/data/site.js`. The workshop carries the service into both the WhatsApp draft and the project enquiry. The checkout remains on the live store.
- GymDrobe’s product detail saves the shopper’s colour in the link, selects its first image and restores a shared colour if the product still offers it. The pinned ProductPage implementation contains both the URL write and the initial selection check. Its product and pinned source links are in `src/data/product-evidence.js`. Verify the live behaviour and source before updating this claim. Everyday Luxvibe and FABEA remain labelled as concepts.

## Phone acceptance test

Show the opening on a silent phone for five seconds. Ask who the developer is, what he builds and how to contact him. Hand the phone to a first-time player without coaching. Count the attempts to park at GymDrobe, let the visitor open the shop, then ask them to return to the pickup and choose their next destination. Record actual answers and whether the visitor chooses another lap. Automated browser runs measure layout, controls and state; real-device play and a human response require a separate session.

## Refresh project previews

Project previews are registered in `src/data/project-previews.js`. The homepage, enlargement dialog, services pages and case study share the same screenshot. Capture dates remain separate from code-review dates.

Inspect the actual public homepage, dismiss optional overlays, wait for visible images/fonts, and capture a clean desktop screenshot at 1348 × 926 or larger with the same aspect ratio. Confirm that it shows the current design rather than a login, error, popup or loading state.

```sh
npm run preview:update -- gymdrobe /absolute/path/to/capture.jpg 2026-10-30T12:00:00Z
npm run verify
```

The helper validates the capture, generates optimized WebP with a content-based filename, preserves the last good preview on invalid input and skips identical output. Commit the new image and manifest together. The linked daily preview automation checks for meaningful design changes, ignoring ordinary video-frame, price and inventory changes. It preserves project copy and code-review dates.

Only add verified projects and working links. The current projects are GymDrobe, Everyday Luxvibe and FABEA. The latter two are independent storefront concepts. A separately verified portrait capture can be published with the same command and a trailing `mobile` argument. A desktop update automatically hides the previous portrait until its matching version has been verified. The product sample photos are independent of the homepage captures.
