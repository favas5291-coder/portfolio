# Fazhere Studio · The Appointment

A prospective client visits Favas’s virtual studio in Kozhikode. Native scroll leads from the passenger seat across a shaded threshold to the GymDrobe project room, a working studio, the courtyard landing and the founder’s desk. Every room also has a direct link. The portfolio can be read with stills, JavaScript disabled or sound off.

[Review preview, screenshots, walkthrough and measurements](docs/appointment/README.md)

## Run and review

Use Node 22.12 or later. Run `npm ci`, then `npm run verify` for unit tests, the Vite production build, prerender validation for all public routes, internal links and the initial JavaScript budget. Use `npm run dev` to edit and `npm run preview` to inspect the production output. For an isolated review build, set `SITE_ENV=preview` before building. To package that build run `node scripts/build-fit-preview.mjs visual-checks/appointment-preview.tar.gz`.

## Maintain the studio

- **Move a camera stop.** Edit `src/appointment/visit.js`. It holds the ordered room IDs, normalised progress, eye positions and focal targets in metres, plus a separate lens for compact views. Check both ends of the visit, the open door during reverse scrolling and stair clearance after moving a stop. Keep the upper window and car on the same sightline.
- **Change the architecture.** The courtyard, floors, glazing and stairs live in `src/appointment/architecture.js`; the car body, door hinge, seat and trim in `car.js`; the upper room and review furniture in `furnishings.js`. Keep passageways clear at the configured camera positions when replacing a model. The courtyard tree has its own seeded geometry. The material credits live alongside the finishes in `public/appointment/finishes/`.
- **Regenerate architectural stills.** Use the version of Playwright from the browser-review workflow and install Chromium. Run `node scripts/render-appointment-stills.mjs` from the project root. The same scene and camera generate six rooms in two compositions. Set `CHROME_PATH` to select another installed Chromium. Recheck phone and desktop after changing the geometry, cameras, lighting or panel aspect ratio.
- **Change quality or motion.** `src/appointment/scene.js` sets pixel-ratio limits, shadow sizes, idle rendering and slow-device fallback. The homepage defers the renderer until someone starts exploring. Native scroll, buttons and direct links remain available. `StudioSound.jsx` provides optional synthesized ambience; it starts off.
- **Update a project, service or contact.** Edit the verified records in `src/data/portfolio.js`, the preview manifest via the helper below, and the configured services, process and WhatsApp destination in `src/data/site.js`. The project room reads the existing exhibit catalogue. At the desk, service and enquiry text carry through to the contact form or WhatsApp. An unfinished brief is saved only in the visitor’s tab session.
- **Run the visit checks.** With the production preview serving, run `node scripts/review-appointment.mjs` using the Playwright version and browsers from `.github/workflows/cinematic-visual.yml`. The workflow runs the checks and uploads the evidence on a pull request.

## Art direction and exhibit sources

The building is a fictional virtual studio. The external architecture informed three original decisions made for this visit.

- The courtyard links the street, project table and landing. Timber screens shade the upper floor. [Stapati’s Team Thai Corporate Office](https://stapati.com/projects/team-thai/)
- Shallow eaves and a long canopy separate the wet kerb from the dry, indirectly lit reception. [Renzo Piano Pavilion at the Kimbell](https://kimbellart.org/art-architecture/architecture/renzo-piano-pavilion)
- The camera settles before the project opens as a readable exhibit. [Undream Studio’s The Silence Museum](https://www.undreamstudio.com/projects/the-silence-museum/)
- The local shopping example uses the original GymDrobe shirt photos. On the live product, selecting red changed the gallery and set the colour in the address; reopening the link restored that choice. The displayed size labels were identical in the two colours checked. The portfolio excerpt demonstrates the photo and link. [Product source](https://github.com/favas5291-coder/gym-store/blob/6e93a5643feb745c673936cb16e5937b9f8761db/src/pages/ProductPage.jsx#L160-L238) · [Live red variant](https://www.gymdrobe.com/product/6ad2351ed8f991271e3d1a8b?colour=RED)

## Refresh project previews

Project previews are registered in `src/data/project-previews.js`. The visit, project viewer and case studies read the registered captures. The colour demonstration uses the registered product imagery. Capture dates remain separate from code-review dates.

Inspect the actual public homepage, dismiss optional overlays, wait for visible images/fonts, and capture a clean desktop screenshot at 1348 × 926 or larger with the same aspect ratio. Confirm that it shows the current design rather than a login, error, popup or loading state.

```sh
npm run preview:update -- gymdrobe /absolute/path/to/capture.jpg 2026-10-30T12:00:00Z
npm run verify
```

The helper validates the capture, generates optimized WebP with a content-based filename, preserves the last good preview on invalid input and skips identical output. Commit the new image and manifest together. The linked daily preview automation checks for meaningful design changes, ignoring ordinary video-frame, price and inventory changes. It preserves project copy and code-review dates.

Only add verified projects and working links. The current projects are GymDrobe, Everyday Luxvibe and FABEA. The latter two are independent storefront concepts. A separately verified portrait capture can be published with the same command and a trailing `mobile` argument. A desktop update automatically hides the previous portrait until its matching version has been verified. The product sample photos are independent of the homepage captures.
