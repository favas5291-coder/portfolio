# Fazhere Studio walkthrough verification

Reviewed `e5ca84b` against main `19d875b` on 20 November 2026. [Pull request](https://github.com/favas5291-coder/portfolio/pull/16) · [Private interactive preview](https://fazhere-studio-walkthrough-review.g6z79k29bp.chatgpt.site) · [Offline ZIP](after/Fazhere-Studio-Offline.zip)

| Evidence | Desktop | Phone |
| --- | --- | --- |
| Walkthrough | [29 seconds](after/desktop-walkthrough.mp4) | [28 seconds](after/mobile-walkthrough.mp4) |
| Entrance | [Before and after](after/entrance-comparison-desktop.jpg) | [Before and after](after/entrance-comparison-mobile.jpg) |

## What changed

The prior doorway blended into the interior frames, GymDrobe competed with the receptionist, and the founder was too far across the desk. The new camera approaches visible brass pulls, passes a screened reception desk with a view of the founder’s lamp, and settles in the visitor’s chair at 1.19 m eye height. [Baseline and open PR review](before/BASELINE.md) · [Entrance and founder side by side](after/arrival-and-founder.jpg)

## What passed

- **Build.** 77 tests, 11 prerendered pages, the 404, metadata, sitemap, internal links and bundle checks passed. Initial homepage JavaScript measured 86.2 KiB gzip. [Build check](https://github.com/favas5291-coder/portfolio/actions/runs/44685751823)
- **Navigation.** A 120-pixel scroll entered reception, reverse scrolling returned outside, and all six fragments and keyboard links reached their rooms. Reduced motion, unavailable WebGL and forced context loss retained the room views and controls. [Browser checks](https://github.com/favas5291-coder/portfolio/actions/runs/44685751716)
- **Projects.** Black and Red changed the actual GymDrobe photograph on both the 3D monitor and HTML sample. Back, Close and Escape restored the room, colour, focus and reading position. FABEA retained its independent-concept disclosure. [Black exhibit](after/live-product-black.jpg) · [Red exhibit](after/live-product-red.jpg) · [GymDrobe colour handling](https://github.com/favas5291-coder/gym-store/blob/935e09add8383cfa104379f83e002ed3b0834b8f/src/pages/ProductPage.jsx#L139-L214)
- **Contact.** Both WhatsApp entry points opened the configured number, +91 81568 05806, with the requested editable draft. The tests intercepted navigation locally and sent no messages. The secondary email resolved to favas5291@gmail.com.
- **Offline.** The extracted HTML passed four WebKit sessions with network requests blocked, covering all fourteen stills, case history, keyboard focus, context loss and automatic fallback. [Offline checks](after/standalone-offline.json)

## Performance and limits

One cold, unrecorded run per configuration used uncompressed localhost HTTP, DPR 1, no CPU or network throttling, and a four-vCPU Debian VM on an Intel Xeon Platinum 8573C. Chromium used SwiftShader. Linux WebKit used Mesa llvmpipe. Its renderer string was masked. Recordings and timings use `d072a26`. The final commit changed keyboard focus timing only.

| Browser and viewport | First contentful paint | First live view | Live WebGL submission interval, median / p95 | Still-mode scroll callbacks, median / p95 |
| --- | ---: | ---: | ---: | ---: |
| [Chromium 156 · 1440 × 900](after/chromium-desktop-performance.json) | 1020 ms | 3.30 s | 893 / 2188 ms (4 intervals) | Outside this sample |
| [WebKit 26.5 · 1440 × 900](after/webkit-desktop-performance.json) | 315 ms | 3.29 s | 238 / 453 ms (5 intervals) | 28 / 42 ms |
| [WebKit 26.5 touch emulation · 390 × 844](after/webkit-mobile-performance.json) | 660 ms | 3.75 s | 122 / 211 ms (7 intervals) | 16 / 22 ms |

Live 3D visibly stuttered on software rendering, with multi-second stalls in desktop Chromium. The live sample sizes were small. Both WebKit configurations reduced resolution, then selected stills about five seconds after navigation. The MP4s use the visible 3D control to demonstrate the moving camera and cast.

Physical iPhone Safari, hardware-GPU performance, cellular delivery and comprehension with a first-time client remain untested. The private deployment succeeded. Browser QA used the local production build because the shared browser could not start a signed-in preview session. The repository lacked a verified rigged likeness of Favas, so the founder appears in illustrative profile.
