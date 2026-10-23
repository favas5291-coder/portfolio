# Automatic 3D startup and mobile verification

## Root causes in the deployed source

- `useExperience` skipped WebGL detection and selected static mode when Data Saver, device memory <= 4 GB, or hardware concurrency <= 4 was reported. These are quality hints, not WebGL capability tests.
- The same hook disabled 3D entirely for `prefers-reduced-motion` and prevented the visitor from changing the motion setting.
- A 12-second wall-clock timeout abandoned valid slow loads, including time spent in a background tab.
- Context loss unmounted the canvas immediately, preventing normal WebGL restoration.
- Touch scroll measurement and demand-render wakeups ran independently, so the last wake could read old progress. Viewport changes needed explicit invalidation as well.
- The mobile camera used a fixed extra Z distance instead of fitting the exploded sculpture to its available space.
- Environment and screen-texture loading suspended the entire scene.

## Resulting behavior

Fresh visits attempt WebGL 2 automatically on every device. Hardware hints only select a quality tier. Automatic renderer failure never writes a persistent 2D preference. This Three.js version requires WebGL 2; WebGL 1-only devices receive the accessible fallback with Retry 3D.

The old `forge-view=static` entry was written only by the v1 visitor toggle, not automatic fallback. Preserve it as a deliberate choice. New preferences use `forge-experience-v2`, with `source: user`. Unmarked/automatic v2 entries are ignored. Choosing Enable/Retry 3D replaces an old 2D preference.

Reduced-motion visitors receive a stable 3D sculpture without the introductory explosion, camera travel, pointer tilt or scroll fly-through. Selection highlights remain available. Enable full motion is an explicit persistent override. Gentle motion and 2D are independent user choices.

Quality starts conservatively on compact/touch devices and low-resource or Data Saver hints. Consecutive rendered-frame samples adjust DPR (0.75 / 1 / 1.5), round-geometry segments (16 / 32 / 48), cable geometry, screen-texture resolution (512 / 1024 / 2048 maximum), studio reflections, shadow maps and bloom. The core model and scroll timeline remain active at every tier. The existing scene has no particles to reduce. Phone/touch quality is capped at medium. High-quality desktop HDR, bloom, geometry and authored camera positions are preserved.

Rendering uses one Fiber demand loop, goes idle after motion settles, and pauses while hidden. Touch scroll remains native. Scroll refs are updated before invalidation. ResizeObserver, visual viewport, orientation, font layout and page restore changes refresh measurements. Context loss retains the canvas, pauses drawing and requests browser restoration; unrecovered loss after 20 visible seconds offers Retry 3D. Hidden time does not consume that recovery window. Retry remounts the scene and its error boundary without persisting an automatic fallback.

Optional environment, screen texture and effects failures are isolated from the procedural sculpture. No 12-second load deadline remains. Event listeners, timers, generated textures, geometries and animation subscriptions have cleanup paths.

## Verification actually performed

- `npm test`: 27 Node tests passed for preferences, reduced-motion overrides, quality adaptation/cooldown, native scroll sampling, lifecycle cleanup/recovery, compact camera bounds and preservation of the desktop camera path.
- `npm run verify`: production build, prerender, static asset/link/metadata checks and initial-JavaScript budget passed. Initial JavaScript: 77.2 KiB gzip (125 KiB budget). Validation ran on Node 24.19.0; Render is configured for Node 22.22.0.
- Cloud Chromium: phone-sized 390x844 and 320x780 frames, tablet-sized 820x1180 and desktop-sized 1348x900 frames. Simulated coarse input, reduced motion, 2 GB memory and two cores. Checked automatic renderer attempts, no horizontal overflow, fitting navigation, programmatic native scrolling/progress, width/height swaps, full-motion override and refresh, deliberate legacy 2D preference and re-enabling 3D.
- Cloud Chromium's renderer reports `GL_VENDOR = Disabled` and cannot create a WebGL context. Real WebGL failure/fallback and Retry 3D were exercised; successful 3D drawing, GPU performance, actual touch gestures and GPU context restoration could not be tested here. Viewport frames are layout checks, not Android/iOS browser emulation.
- Android Chrome on hardware, iPhone Safari, iPad Safari, desktop GPU rendering and actual browser background/resume remain unverified. Recovery event behavior was tested with synthetic event targets, not a physical GPU. No FPS or Lighthouse score is claimed.

Run the browser fixture only on a development/test origin: `npm run dev`, then open `/tests/browser.html` and click Run checks. It resets only this portfolio's preference keys on that test origin. It does not ship in `dist`.

## Device checks before considering mobile GPU behavior verified

On Android Chrome, iPhone Safari, a tablet and a desktop with working WebGL 2:

1. Start in a private session. Check the real sculpture appears automatically without Enable 3D.
2. Scroll from Home through Contact, then back. Check the sculpture transforms continuously and content/navigation remain usable.
3. Reload at Home and at a middle chapter. Confirm correct timeline position, no replayed mid-page introduction, and no unexpected 2D preference.
4. Rotate portrait/landscape; collapse/expand the browser address bar. Check framing and continued scrolling without resets.
5. Background the tab for 30 seconds and return. Confirm current scroll position resumes without jumps/freezes. Repeat during initial loading.
6. Test Data Saver, CPU slowdown and low-end hardware. Confirm quality decreases while the model and timeline remain active. Inspect `data-quality` on the stage if needed.
7. Enable OS reduced motion. Confirm gentle 3D; opt into full motion and reload. Verify the explicit override persists.
8. Choose 2D deliberately and reload; verify it persists. Enable 3D and reload; verify 3D persists.
9. On a development GPU browser, use the `WEBGL_lose_context` extension to simulate loss/restoration. Check recovery retains the canvas and motion resumes. Test failed recovery followed by Retry 3D.
10. Throttle or block optional HDR, screenshot and effects requests. The base sculpture should remain visible and animated. Test a slow initial scene chunk without the former 12-second abandonment.

## Build and Render deployment

After applying the included patch to your local checkout:

```bash
npm ci --include=dev
npm test
node scripts/set-site-url.mjs https://fazhere.com
npm run build
node scripts/verify-build.mjs
```

`npm run verify` runs tests, build, prerender and output checks. Running the domain helper first keeps the local output canonical URL correct.

In the existing Render **portfolio-1 Static Site**, keep:

| Setting | Value |
| --- | --- |
| Repository | favas5291-coder/portfolio |
| Branch | main |
| Root Directory | empty |
| Build Command | `npm ci --include=dev && node scripts/set-site-url.mjs https://fazhere.com && npm run build && node scripts/verify-build.mjs` |
| Publish Directory | `dist` |
| NODE_VERSION | `22.22.0` |

Save, then Manual Deploy > Deploy latest commit if auto-deploy has not already started. Wait for Deploy succeeded / Live. Test both the Static Site's onrender.com URL and https://fazhere.com in a private phone session. No DNS changes or new Render service are needed for this code change. Do not deploy the old Docker Web Service.

GitHub allowed repository reads but rejected branch creation with HTTP 403, Resource not accessible by integration. No remote branch, commit, PR or deployment was created. Apply the patch locally, run the checks, commit the changes and push main before deploying. The bundle contains the complete contents of every changed file as well as a Git patch.
