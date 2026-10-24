# Responsive 3D quality update

This update uses the laptop's existing scene, objects, materials, lights and authored camera timeline on supported phones and tablets. It removes device-based appearance reductions and changes rendering cost only in response to sustained measured frame times. The existing mobile hero, business introduction, WhatsApp button, content and links remain intact.

Source baseline: `favas5291-coder/portfolio`, GitHub commit `c2488a0fada5825a4bb94500edfd8e8d11d0a846`. The relevant baseline file blobs were checked against the local checkout before editing. The patch is prepared for this version. These changes have not been pushed to GitHub or deployed to Render.

## Causes found in the source

| Cause | Result before this update | Change |
| --- | --- | --- |
| Width below 900px, touch, Data Saver, memory or core count selected tier 0 | Phones began at 0.75 DPR, 16 segments, 512px screen texture, no shadows or effects | Every device starts with the existing high-detail assets and geometry; no device-class ceiling |
| Mobile/touch maximum tier was 1 | Fast phones could never reach the laptop tier | All devices can recover to high after sustained fast frames |
| Antialiasing was selected once from the initial tier | Phones kept antialiasing disabled even after a quality increase | Context antialiasing enabled; HDR composer uses supported MSAA, with FXAA when float-buffer MSAA is unavailable |
| Low/medium tiers used different environment lighting; bloom required width >= 900 | Mobile metal, light, depth and glow looked different | Same local HDR environment, light intensities, materials, shadow casting and bloom settings at all widths |
| Composer and direct-render paths could use different tone mapping | Missing effects could also change colors | Explicit sRGB output and the approved composer's NoToneMapping behavior on both paths |
| Mobile replaced authored object translation and scale; camera fitted one oversized box | Different apparent motion and unnecessarily small sculpture | Preserve object transforms and viewing direction; fit component bounds, including still-moving plates, into the available scene area |
| Spring Euler integration and frame-delta caps varied with frame rate | Slow devices changed the motion response and could stretch timing | A shared spring update preserves the original 60Hz response, with equivalent fixed-target timing at 20–120Hz |
| Scroll anchors used the changing visible viewport height | Browser address-bar changes shifted the sampled animation position | Stable `100svh` chapter measurements; the canvas still follows its actual visible size |

## Rendering and lifecycle

The normal laptop drawing ratio remains 1.5, limited by the screen's native DPR. Small phone canvases can use up to 2 DPR. The drawing buffer is recalculated from its displayed size, native DPR and GPU dimension limits, with a 4.8-million-pixel ceiling. A 390×844 phone at native DPR 3 therefore starts at 780×1688 rather than the old approximately 293×633 buffer. Rendering at the full native DPR of every high-density screen would add substantial cost; this cap is intentional.

| Tier | DPR cap | Cylinder segments / cable segments | Screen texture limit | Shadow map | Bloom resolution scale |
| --- | --- | --- | --- | --- | --- |
| High | 1.5–2, subject to native DPR and buffer budget | 48 / 40 | 2048px | 1024px | 0.50 |
| Detailed | 1.25 | 48 / 40 | 2048px | 1024px | 0.35 |
| Balanced | 1 | 32 / 28 | 2048px | 512px | 0.25 |

The screen image retains its original detail within the texture/hardware limit and uses up to 8× supported anisotropic filtering. The update adds no larger assets or new dependencies. It does not introduce a different mobile animation or replace the scene with 2D to improve performance.

The monitor samples consecutive frames, ignores suspended/idle intervals, allows a warm-up after reconfiguration, and uses sustained slow/fast windows plus a cooldown. HDR lighting, materials, shadows and the main scene remain active even at the lowest tier. Optional HDR post-processing requires the actual `EXT_color_buffer_float` capability; unsupported or failed optional effects can be omitted while the main scene remains. A failed HDR asset uses the existing studio-light fallback.

The existing demand-render loop, hidden-page pause, context recovery, retry and intentional 2D choice remain. Automatic failures do not overwrite saved preferences. Explicit reduced motion keeps the gentle assembled 3D presentation; the existing full-motion option remains available. Layout and DPR changes wake the same renderer. Texture copies and listeners are cleaned up on unmount.

## Changed files

| File | Purpose |
| --- | --- |
| `src/experience/quality.js` | Shared appearance tiers, density/buffer budget and recovery without a mobile ceiling |
| `src/experience/scroll.js` | Stable chapter anchor helper |
| `src/hooks/useExperience.js` | Stable viewport measurement and cleanup |
| `src/scene/dynamics.js` | Shared frame-rate-independent spring update |
| `src/scene/ForgeEffects.jsx` | Bloom at all supported widths and composer antialiasing |
| `src/scene/ForgeScene.jsx` | Common lighting/material pipeline, accurate DPR, texture handling and shared transforms |
| `src/scene/framing.js` | Responsive fitting along the authored viewing ray |
| `tests/dynamics.test.mjs` | Original 60Hz response, frame-rate equivalence and idle/resume checks |
| `tests/experience.test.mjs` | Quality, pixel budget, recovery, scroll and lifecycle regressions |
| `tests/framing.test.mjs` | Framing, quick reverse scroll, viewing direction and unchanged desktop camera tests |
| `tests/mobile-layout.html` | Wait for app initialization/fonts before existing layout assertions |
| `tests/render-parity.html` | Manual comparison and browser checks at matching animation stages |
| `docs/RENDER-PARITY.md` | Findings, validation, application and deployment guide |

## Verification performed

- 43 Node tests passed, including the existing preferences, context lifecycle, SEO and enquiry tests.
- Production build, prerender and build verification passed: nine public pages and a 404 document.
- Initial JavaScript: home 84.6 KiB gzip; services 83.8 KiB gzip, within the existing 125 KiB budget. The 3D renderer remains deferred.
- The large optional renderer chunk still produces Vite's chunk-size warning. The build succeeds; this warning is not a measured GPU performance result.
- Cloud Chromium: 82 production layout assertions passed at 320×780, 375×844, 390×844 and 430×844, with desktop comparisons at 1024×900, 1348×900 and 1920×900. No measured desktop element differences exceeded 1px.
- The existing experience browser fixture passed 30 assertions covering native scrolling, resize, automatic 3D attempt/error fallback, persisted intentional 2D and gentle/full-motion controls.
- The new production comparison fixture passed 54 non-GPU assertions at 320×780, 375×812, 390×844, 430×932, 820×1180 and 1348×900: all five chapters, initialization, overflow and orientation state. GPU drawing checks were explicitly unavailable at all six sizes.
- Pure camera tests cover phone and tablet sizes through 1024×1366, including 375px and landscape; they verify geometric containment and authored desktop positions. They do not verify rendered pixels.

The cloud browser has its GL renderer disabled. Successful WebGL drawing, matching-stage GPU screenshots, visual antialiasing, lighting, real frame rates and actual context restoration could not be verified there. No physical Android Chrome, iPhone Safari or iPad Safari device was available. Browser viewport tests are not substitutes for those device tests. Device-level thermal behavior, touch scrolling with browser chrome, background/resume and orientation also need the checks below. The implementation addresses the source causes; identical GPU output on every supported phone has not been demonstrated.

## Apply and build, one command at a time

1. Extract `Favas-Responsive-3D-Quality-Fix.zip`.
2. Copy only `responsive-3d-quality.patch` into your existing project beside `package.json`.
3. In Git Bash, run:

```bash
cd "/c/portfolio 3d/portfolio"
git apply --check responsive-3d-quality.patch
git apply responsive-3d-quality.patch
npm run verify
```

The two `git apply` commands normally print nothing on success. If the check reports an error, stop and share it; do not force the patch over newer edits. `npm run verify` runs tests, builds `dist`, prerenders the pages and verifies the output. No dependency or lockfile changes are required. If dependencies are absent, run `npm ci --include=dev` first.

The archive also contains complete replacement files under `replacement-files/`, using their exact project paths. This is a subset of the project. Use the patch or those individual replacements, not both; do not replace the entire `src` folder or build inside `replacement-files`.

Review and commit only the intended files:

```bash
git --no-pager diff --stat
git add src/experience/quality.js src/experience/scroll.js src/hooks/useExperience.js src/scene/dynamics.js src/scene/ForgeEffects.jsx src/scene/ForgeScene.jsx src/scene/framing.js tests/dynamics.test.mjs tests/experience.test.mjs tests/framing.test.mjs tests/mobile-layout.html tests/render-parity.html docs/RENDER-PARITY.md
git --no-pager diff --cached --stat
git commit -m "Match responsive 3D rendering to the laptop experience"
git push origin main
```

Do not use `git add .`: downloaded ZIPs, patches and replacement folders are not part of the application update.

## Render deployment

Use the existing **portfolio-1 Static Site**, connected to `favas5291-coder/portfolio`, branch `main`. The project's configuration is:

- Root directory: blank (repository root).
- Publish directory: `dist`.
- Node version: the existing `NODE_VERSION=22.22.0` setting.
- `SITE_ENV=production`.
- Build command:

```bash
npm ci --include=dev && node scripts/set-site-url.mjs https://fazhere.com && npm run verify
```

After the push, inspect the deploy for your new commit. If automatic deploys are off, use **Deploys → Manual Deploy → Deploy latest commit**. Wait for **Live**, then refresh the site on your laptop and phone. Render documents these options in [Deploying on Render](https://render.com/docs/deploys). This update needs no DNS or domain changes.

The existing nine-page project should not use a catch-all `/*` → `/index.html` rewrite. If an earlier deployment still has that rule, follow `docs/SEO-DEPLOY.md` for its removal so missing URLs return a real 404. After Live, run:

```bash
node scripts/check-deployment.mjs https://fazhere.com
```

That checks HTTP/SEO behavior, not GPU visuals.

## Matching-stage and real-device checks

Run `npm run dev` in the real project, then open `http://localhost:4173/tests/render-parity.html`. For a phone on the same private Wi-Fi, use your computer's local network address shown by Vite, with the same port and path. The fixture is development-only and is not published by the normal production build.

1. Compare the laptop with 320, 375, 390, 430 and 820px viewports. Use **Show stage** for Assembly, About, Exploded parts, Project screen and Contact. Capture the same settled stage for each viewport, then also watch movement between stages.
2. On physical Android Chrome and iPhone Safari, choose **Current device**. Check a fresh private-window visit and refresh: 3D should initialize without pressing Enable 3D unless WebGL really fails. A deliberate saved 2D preference should still be honored in an ordinary window.
3. Compare the metal reflections, orange glow, project-screen text, fine edges, shadows and framing. Use the fixture's buffer/DPR readout to confirm resolution follows the canvas size. A fallback image cannot establish visual parity.
4. Scroll slowly, quickly and backwards through all chapters; rotate both ways; collapse/expand the browser address bar; background the page for 30 seconds and return. Check that the scene resumes, buttons remain usable and no horizontal overflow or blank canvas appears.
5. Test system reduced motion, then the intentional full-motion option. Check both on refresh.
6. On a WebGL-enabled device, use **Test context recovery** if the browser exposes `WEBGL_lose_context`. Verify recovery or a usable Retry 3D fallback. This button does not change stored view preferences.
7. Observe sustained use on a slower phone. Cost may step down after sustained slow frames and recover later; the animation sequence, HDR lighting and main objects must stay present. Desktop CPU throttling is only a diagnostic and does not reproduce a mobile GPU or heat behavior.

The fixture's **Run viewport checks** button checks native chapter progression, layout and resize state, and explicitly marks GPU checks as unavailable when the renderer cannot start. All checks avoid opening contact links or sending messages.
