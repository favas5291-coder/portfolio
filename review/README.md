# Fazhere Studio walkthrough verification

Reviewed `e5ca84b` for [pull request 16](https://github.com/favas5291-coder/portfolio/pull/16) on 20 November 2026. It starts from `19d875b` on the portfolio’s main branch. The tour is available as a [private interactive preview](https://fazhere-studio-walkthrough-review.g6z79k29bp.chatgpt.site) and a [downloadable offline preview](after/Fazhere-Studio-Offline.zip). Extract the ZIP and open the HTML in a browser.

## Visual review

| View | What to look for |
| --- | --- |
| [Desktop entrance, before and after](after/entrance-comparison-desktop.jpg) · [Phone entrance, before and after](after/entrance-comparison-mobile.jpg) | The plaque, brass pulls and check-in desk are legible from outside. One short scroll moves through the opening doors. |
| [Entrance and seated endpoint](after/arrival-and-founder.jpg) | The same materials continue into the gallery. The warm lamp seen from reception is beside the founder’s notebook at the final stop. |
| [Desktop walkthrough](after/desktop-walkthrough.mp4) · [Phone walkthrough](after/mobile-walkthrough.mp4) | The 29-second desktop and 28-second phone recordings visit all six rooms. The colour choice changes the exhibit and the founder’s desk presents the project enquiry. |
| [Original room captures and recordings](before/) · [Final room captures and measurements](after/) | The baseline includes entrance, reception, project room and founder at both sizes. |

The original glass doorway disappeared among the interior frames, the flagship screen competed with reception, and the final view stayed well back from the desk. The new approach exposes the door hardware and moves past the jambs. The reception screen wall separates check-in from the exhibit. Inside the last doorway the eye drops from standing height to 1.19 m at the visitor’s chair. The [baseline report](before/BASELINE.md) identifies the live URL, relevant open PRs and capture modes.

## Visitor checks

- All six direct links opened the intended rooms. The opening gave Favas’s full name, role, services and contact link in HTML. A 120-pixel scroll crossed the threshold. Reversing the gesture returned outside. The directory and room strip also worked by keyboard.
- Selecting Red changed the COITONIC photograph on both the HTML sample and the live 3D monitor. A canvas-only comparison measured 2,690 pixels newly classified as red in the display region. [Black](after/live-product-black.jpg) · [Red](after/live-product-red.jpg) The source-backed example describes how the store restores a colour from the product URL and selects the corresponding gallery. Back, Close and Escape returned visitors to the project room. Back retained the colour, opener focus and scroll offset. FABEA retained its independent-concept description and approved exhibit image. [GymDrobe implementation](https://github.com/favas5291-coder/gym-store/blob/935e09add8383cfa104379f83e002ed3b0834b8f/src/pages/ProductPage.jsx#L139-L214)
- The five review stages and three client questions worked as HTML controls. Both WhatsApp actions resolved to the configured number, +91 81568 05806, with the editable text “Hi Favas, I visited your studio. I’d like to discuss a project.” Requests were intercepted before leaving the browser. The secondary email resolves to favas5291@gmail.com.
- Reduced motion, unavailable WebGL and forced context loss each retained six corresponding room views, product controls and contact. The offline package was tested with HTTP and HTTPS blocked. [Offline test details](after/standalone-offline.json)
- The production verification passed 77 tests, checked 11 prerendered routes plus the 404 document, and checked the sitemap, canonicals, contact links and initial bundle. Initial homepage JavaScript totaled 86.2 KiB gzip. The 3D code loads separately.

## Production-build performance

The recordings and timing samples use `d072a26`. The final commit changes one room-menu focus call. Its camera, materials, animation and render-quality code are identical to the measured revision. All navigation checks use the final production build.

One cold run per configuration served the production files over uncompressed localhost HTTP. Tests used DPR 1, no network or CPU throttling, and a Debian Linux VM with an Intel Xeon Platinum 8573C and a four-vCPU quota. WebKit used Mesa llvmpipe. Its privacy-masked renderer string reads “Apple GPU.” Chromium used ANGLE SwiftShader.

| Browser and viewport | First contentful paint | First live view | Live WebGL submission interval, median / p95 | Still-mode scroll callbacks, median / p95 |
| --- | ---: | ---: | ---: | ---: |
| [Chromium 156 · 1440 × 900](after/chromium-desktop-performance.json) | 1020 ms | 3.30 s | 893 / 2188 ms (4 intervals) | Outside this sample |
| [WebKit 26.5 · 1440 × 900](after/webkit-desktop-performance.json) | 315 ms | 3.29 s | 238 / 453 ms (5 intervals) | 28 / 42 ms |
| [WebKit 26.5 touch emulation · 390 × 844](after/webkit-mobile-performance.json) | 660 ms | 3.75 s | 122 / 211 ms (7 intervals) | 16 / 22 ms |

Live motion visibly stuttered on these software renderers. Desktop Chromium recorded a multi-second gap and only four submission intervals in the measured scroll, so its percentiles carry little statistical weight. Both WebKit runs reduced resolution, then selected matched stills roughly five seconds after navigation. The phone’s subsequent scroll callbacks measured 16 ms median and 22 ms p95. The recordings use the visible 3D control to show the moving camera and cast. The performance samples use the automatic setting without recording overhead.

## Review limits

The approved storefront imagery and product photographs are local to the build. The repository lacked a verified rigged likeness of Favas. The founder therefore appears in illustrative profile, identified by name, and the office cast illustrates the client process. The architecture uses licensed CC0 materials and garden photography.

The tests cover Linux browser engines, local production files, and an emulated touch viewport. Physical iPhone Safari, hardware-GPU performance, cellular delivery and comprehension with a first-time client remain untested. The private preview deployment reported success. The shared browser could not open its signed-in session, so hosted visual inspection was unavailable. The walkthrough recordings and browser measurements come from the reviewed production build.
