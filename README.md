# Fazhere Studio · The Appointment

This local Gate 1 candidate proves the passenger-door exit, entrance and return view from the guest chair. The studio in Kozhikode is virtual. The façade, parked hatchback and tree share a measured Blender set. Reception, the working floor, stair and guest room currently have the geometry needed for the camera path and sightline checks. Their existing HTML project, service and contact experiences come from PR #18.

[Local Gate 1 review material](docs/appointment/gate-1/) · [Approved Gate 0 plan and section](docs/appointment/gate-0/README.md) · [Previous PR #18 preview and evidence](docs/appointment/README.md)

## Run and review

Use Node 22.12 or later. Run `npm ci` and `npm run verify` for unit tests, the Vite production build, prerendered routes, links and JavaScript budget. Use `npm run dev -- --host 127.0.0.1` to work locally. After a build, `npm run preview -- --host 127.0.0.1` serves the local production bundle. Set `SITE_ENV=preview` when building a noindex review bundle. Local work has its own approval gate. A hosted preview and production each need separate written approval.

## Maintain the two views

- **Cameras and doors.** Edit `src/appointment/scene.config.ts` for room anchors, camera poses and lenses, door curves, physical dimensions and asset references. Coordinates are metres in east, north, up. The adapter in `visit.js` converts to Three.js coordinates and interpolates from native scroll progress. Check the open timber bay from the passenger seat, then both kerb-side wheels from the guest chair. A door or lens change needs a mid-exit reversal as well as the two holds.
- **Models.** The authored shell, car and tree live in `scripts/gate1/{shell,car,tree}.py`. Run the corresponding author script with headless Blender, e.g. `blender -b --factory-startup -P scripts/gate1/car.py`. These scripts write GLBs in `public/appointment/models/`. Keep the passenger and entrance hinges, office screen and wet patches identifiable to the renderer. The office screen needs its UVs and four physical corners. Check real mesh clearance after substituting any asset.
- **Light and compression.** Bake the shell with `blender -b -P scripts/gate1/bake_shell.py -- /path/to/raw-shell.glb /path/to/baked-shell.glb`. Run `bash scripts/gate1/optimize.sh /path/to/source.glb /path/to/optimized.glb` on each asset, using glTF Transform and Khronos KTX-Software. Install the resulting GLBs at the paths in the config. Keep decoder assets under `public/appointment/basis/`. Run `node --experimental-strip-types scripts/gate1/check-clearance.mjs` on the installed files.
- **Stills and screens.** Use the Playwright version from the browser-review workflow and Chromium. Run `node --experimental-strip-types scripts/render-appointment-stills.mjs` from the root. `CHROME_PATH` can select an installed Chromium. This uses the live scene, its configured anchors and the two authored frame sizes to generate six pairs of WebPs. It leaves the physical office monitor dark and saves its projected glass corners and aspect ratio in `src/appointment/stillProjection.json`. The still view and live canvas fit the current project capture within the glass. Refreshing the project manifest updates the image in both modes. Regenerate these plates after any change to geometry, light, lens, camera or screen placement.
- **Phone composition.** The 390 × 844 layout gives 390 × 386 CSS pixels to the architecture. The 1440 × 900 layout gives it 960 × 750. Keep the stage CSS in `visit.css` and the reference compositions in the scene config together. Use an ordinary phone scroll, reverse while crossing the sill and capture both endpoints at each width. Check the first-frame byline, offer, GymDrobe preview, WhatsApp action and scroll cue before starting the renderer. Short viewports reduce the image height to leave the HTML readable.
- **Existing interactions.** The native chapter links, project dialogs, zoom and focus return, session draft, service-prefilled form and contact destinations remain in the React visit. Sound starts off. Project and service records live in `src/data/`. The earlier browser harness at `scripts/review-appointment.mjs` covers those interactions. The local camera capture and detail scripts for this gate live in `scripts/gate1/`.

## Art direction and exhibit sources

The building is a fictional virtual studio. The external architecture informed three original decisions made for this visit.

- The courtyard links the street, project table and landing. Timber screens shade the upper floor. [Stapati’s Team Thai Corporate Office](https://stapati.com/projects/team-thai/)
- Deep eaves and a canopy beside the upper glazing separate the wet kerb from the dry, indirectly lit reception. [Renzo Piano Pavilion at the Kimbell](https://kimbellart.org/art-architecture/architecture/renzo-piano-pavilion)
- The camera settles before the project opens as a readable exhibit. [Undream Studio’s The Silence Museum](https://www.undreamstudio.com/projects/the-silence-museum/)
- The local shopping example uses the original GymDrobe shirt photos. Selecting red changed the gallery and set the colour in the address bar. Opening that address in a fresh context restored red and its photograph. The store’s Share control copied the base product URL during the Gate 0 check. [Observed steps and pinned product source](docs/appointment/gate-0/portfolio.md) · [Live red variant](https://www.gymdrobe.com/product/6ad2351ed8f991271e3d1a8b?colour=RED)

## Refresh project previews

Project previews are registered in `src/data/project-previews.js`. The visit, project viewer and case studies read the registered captures. The colour demonstration uses the registered product imagery. Capture dates remain separate from code-review dates.

Inspect the actual public homepage, dismiss optional overlays, wait for visible images/fonts, and capture a clean desktop screenshot at 1348 × 926 or larger with the same aspect ratio. Confirm that it shows the current design rather than a login, error, popup or loading state.

```sh
npm run preview:update -- gymdrobe /absolute/path/to/capture.jpg 2026-10-30T12:00:00Z
npm run verify
```

The helper validates the capture, generates optimized WebP with a content-based filename, preserves the last good preview on invalid input and skips identical output. Commit the new image and manifest together. The linked daily preview automation checks for meaningful design changes, ignoring ordinary video-frame, price and inventory changes. It preserves project copy and code-review dates.

Only add verified projects and working links. The current projects are GymDrobe, Everyday Luxvibe and FABEA. The latter two are independent storefront concepts. A separately verified portrait capture can be published with the same command and a trailing `mobile` argument. A desktop update automatically hides the previous portrait until its matching version has been verified. The product sample photos are independent of the homepage captures.
