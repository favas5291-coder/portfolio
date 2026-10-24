# Quicker, smoother mobile scroll response

Prepared for `favas5291-coder/portfolio` after commit `d5b3c7e7e99ec1b935a2f0b89352856b53b44743`. The eight existing changed files were checked against GitHub and matched the local source before editing. This is a small follow-up to the successful rendering-quality fix, not a replacement for that update. It is not deployed yet.

## Findings and changes

Native touch scrolling previously scheduled a measurement/scroll RAF, which then woke the renderer for its next frame. The scene also eased both the timeline and the authored camera at rate 5, with another spring response on the parts. This can make a short swipe feel delayed even when the scene looks sharp. During browser-toolbar resizing, dirty measurements could also defer that native input to a later frame.

Native scroll now publishes the latest position immediately, using cached chapter geometry. If resize/font/layout changes have dirtied the geometry, it refreshes that measurement in the scroll handler and replaces its queued measurement frame. It avoids reading full document geometry on every ordinary scroll event. Layout, orientation, fonts and visibility still invalidate the cache correctly.

The scene's native-scroll follow rate changes from 5 to 8, and the parts use a 1.15 spring-time multiplier. This reduces catch-up delay while keeping the same chapter anchors, camera path, objects, disassembly order and section progression. The opening timeline remains 1.6 seconds. It does not jump to a different mobile scene or make visitors skip chapters.

The response is selected from the actual scroll pipeline. `setupMotion` marks when the existing Lenis wheel smoother is installed and clears the flag on cleanup. That path retains the approved follow rate 5, spring multiplier 1 and existing Lenis settings. Native input uses the quicker response. Reduced motion keeps its existing gentle presentation.

The quality monitor now reacts after sustained rendering below 50 FPS, rather than waiting until below 34 FPS. It still uses multiple measurement windows, warm-up, cooldown, idle filtering and sustained recovery above 55 FPS. Every device starts at high quality. The first measured reduction retains 1.5 DPR rather than dropping straight to 1.25, with the same detailed geometry, 2048px texture limit and 1024px shadows. HDR lighting and the core effects remain present. This updates the intermediate DPR listed in the earlier RENDER-PARITY report.

No material, exposure, light, framing, CSS, navigation, contact link or content change is included. There are no new dependencies.

## Changed files

- `src/experience/quality.js` — respond sooner to sustained slow rendering, with a sharper intermediate tier.
- `src/hooks/useExperience.js` — publish native scroll immediately and cache layout measurements.
- `src/motion/setupMotion.js` — identify and clean up the active Lenis input pipeline.
- `src/scene/dynamics.js` — shared response profiles and optional spring-time multiplier.
- `src/scene/ForgeScene.jsx` — use the quicker native follow/spring response with the same scene.
- `tests/browser.html` — immediate native-scroll regression during pending resize; await fonts before checks.
- `tests/dynamics.test.mjs` — preserve the wheel response, verify quicker settling and frame-rate consistency.
- `tests/experience.test.mjs` — sustained 45 FPS adjustment and intermediate resolution regression.
- `docs/MOTION-POLISH.md` — this report and application/deployment guide.

## Verification

- All 46 Node tests passed, including the original laptop spring integration, 20–120 FPS spring timing, quicker native settling, camera/framing, lifecycle, preferences, SEO and enquiry checks.
- Production build, all nine prerendered public pages, the 404 document and output verification passed.
- Initial JavaScript remains within the existing 125 KiB gzip budget: home 84.7 KiB; services 83.8 KiB. The renderer remains deferred.
- Vite still prints its existing large optional chunk warning; the build succeeds.
- All 31 Chromium browser assertions passed at 320px and 390px phone, 820px tablet and 1348px desktop viewport sizes, covering native scroll, rotation-sized resizing, preferences and controls. The new check confirms that native scroll publishes progress synchronously even with a pending resize. GPU drawing was unavailable.
- All 82 existing mobile layout assertions passed at 320, 375, 390 and 430px, with desktop comparisons at 1024, 1348 and 1920px. Desktop element positions/sizes matched the approved baseline within 1px. These are DOM/layout measurements, not rendered 3D screenshots.

The test browser has WebGL disabled. Numeric motion tests and DOM/browser regressions do not measure an actual phone GPU, heat behavior or perceived smoothness. No real Android Chrome, iPhone Safari or iPad Safari test was available. Final touch-scroll smoothness and rendering quality need owner verification after deployment. This update targets the identified latency and performance-governor behavior; it does not establish a measured phone FPS gain.

## Apply one command at a time

Extract `Favas-Mobile-Motion-Polish.zip`. Copy only `mobile-motion-polish.patch` beside `package.json` in the real project. In Git Bash:

```bash
cd "/c/portfolio 3d/portfolio"
git apply --check mobile-motion-polish.patch
git apply mobile-motion-polish.patch
npm run verify
```

No output from the patch commands means success. If the check fails, stop and share the output; do not force it over newer edits. The archive's `replacement-files/` contains the complete replacement code for each changed file as an alternative to the patch. It is not a complete application. Do not replace the whole src folder or build inside replacement-files.

Confirm the actual project files changed, then stage only these nine paths:

```bash
git status --short
git add src/experience/quality.js src/hooks/useExperience.js src/motion/setupMotion.js src/scene/dynamics.js src/scene/ForgeScene.jsx tests/browser.html tests/dynamics.test.mjs tests/experience.test.mjs docs/MOTION-POLISH.md
git --no-pager diff --cached --stat
git commit -m "Improve native scroll response and adaptive smoothness"
git push origin main
```

Uploading the patch or replacement folder alone does not update the running application. Apply the patch before committing the actual source paths above. Do not use `git add .` for this update.

## Deploy and check

Keep the existing Render **portfolio-1 Static Site**, branch `main`, repository-root build and `dist` publish directory. No DNS or settings change is required. The existing build command remains:

```bash
npm ci --include=dev && node scripts/set-site-url.mjs https://fazhere.com && npm run verify
```

After pushing, wait for the new commit to show **Live**. If automatic deployment is off, use **Manual Deploy → Deploy latest commit** on the existing service.

On the same phone/browser where the rendering now looks good, compare a fresh private-window visit with the laptop. Try small swipes, long swipes, reverse scrolling, every chapter, portrait/landscape and collapsing browser chrome. The sculpture should follow sooner and settle smoothly while retaining the same sharp materials and scene. Background the tab and return; check gentle/full-motion controls and navigation. Sustained slow frames may reduce rendering cost, but should retain the scene and reflections. Brief stalls should not trigger repeated changes.

For local DOM checks, run `npm run dev` and open `/tests/browser.html`, then **Run checks**. The matching-stage fixture `/tests/render-parity.html` remains available for actual WebGL-enabled device comparisons. These fixtures are development-only and are not part of the production publication.
