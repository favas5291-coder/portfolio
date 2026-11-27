# Passenger seat to pavement · Local motion study

Open [the study](index.html) inside this folder. Scroll down to open the passenger door and stand on the pavement. Scroll up midway through the doorway to return to the seat. The same document accepts touch, wheel, keyboard and scrollbar input. Keep the clips, thumbnail and two scripts beside the HTML file when copying it.

This local comparison covers progress 0 through 0.21. The React homepage uses the live renderer and its matched fallback stills. Here, a paused H.264 clip supplies the movement. The identity, service description, WhatsApp link and GymDrobe preview remain HTML. The thumbnail was reduced proportionally from the registered desktop capture. The physical screens in the footage use blank plates. [Asset fingerprints and project capture](capture-source.js)

## Encoding

The authoring script samples 61 equally spaced progress values with the homepage's camera, doors, lighting, reflections and three optimized GLBs. It encodes each layout separately at 24 frames per second with closed six-frame GOPs, no B frames and MP4 fast start. Consecutive holds reproduce the same pose. The entire exit takes 2.54 seconds at nominal playback speed. Actual viewing follows the visitor's scroll.

The phone stage is 390 × 386. The wide stage uses the 960 × 750 composition at 0.75 raster scale, encoded at 720 × 562. The browser selects the compact file up to 760 CSS pixels. Resize across the breakpoint to load the other crop at the existing scroll position.

## What the local phone test delivered

| Delivery or measurement | Result |
| --- | --- |
| Compact H.264 at 390 × 386 | 741,811 encoded bytes, 741,811 HTTP body bytes served |
| Wide H.264 at 720 × 562 | 1,576,514 encoded bytes, selected at 1440 CSS px |
| Total bodies served to the 390 px page | 751,091 bytes including the thumbnail, markup and scripts |
| Native scroll to matching frame callback, 40 buffered seeks | 16.7 ms p95 |
| Backward seeks within that sample | 16.7 ms p95 |

Headless Chromium 156.0.8078.79 ran on Linux on an AMD EPYC 9V74, with a 390 × 844 touch-emulated viewport at DPR 1, a loopback HTTP range server and no throttling. The touch recording crosses frame 30, reverses to 14, then returns through 31 to 47. A separate comparison of the decoded image at frame 48 matched across directions. These results cover buffered media on this host. Carrier fetch time and physical phone decoding remain unmeasured.

## Reproduce locally

From the repository root, install its locked application dependencies and provide Chromium, Playwright and FFmpeg. The gate's browser workflow identifies the Playwright version. Point CHROME_PATH at the Chromium executable in use.

```sh
node scripts/gate1/motion-provenance.mjs
MOTION_OUTPUT="$PWD/docs/appointment/gate-1/media-proof" node scripts/render-appointment-stills.mjs
python scripts/gate1/check-motion.py
```

The Python check uses a loopback HTTP range server. It measures 40 discrete native page-scroll changes against the decoded frame's presentation callback, separately checks touch-gesture reversal and compares frame 48 on forward and reverse visits. It checks which file loaded at 390 px and 1440 px. No hosted service is needed.

[Individual timing samples and byte counts](measurements.json) · [Uncut emulated-phone touch reversal](reverse-seeking-390.mp4)
