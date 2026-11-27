# Production build measurements

Mobile Lighthouse 13.6.0, Headless Chromium 158.0.8127.0 on Linux (AMD EPYC 9V45). Three independent cold browser processes per build. The harness fulfilled the localhost origin with the corresponding build’s files through Chromium request interception. Identical uncompressed asset delivery and Lighthouse default mobile simulation (412×823, DPR 1.75, 4× CPU, 150 ms RTT, 1.64 Mbps). This measures build behavior under controlled conditions. Production CDN and mobile carrier latency were outside this test.

| Build | Three scores | Score | FCP (s) | LCP (s) | TBT (ms) | CLS | Transferred bytes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| before | 74, 74, 78 | 74 | 1.26 | 1.26 | 1449 | 0.00014 | 1128469 |
| after | 91, 92, 91 | 91 | 1.11 | 3.51 | 0 | 0.00183 | 450850 |

The median of three runs is reported for each metric. TBT is a lab responsiveness metric. Field INP and 75th-percentile Core Web Vitals were not measured.

## Scroll sampling

Each run uses SwiftShader and a 1× raster viewport. The phone and desktop viewports are emulated. The harness activates the visit with touch or wheel, then samples the display frames in which WebGL submitted a draw while scrolling one viewport toward the project room over 3.5 seconds. Intervals refer to draw frames. The mean spans the full measured time, including an adaptive still fallback if triggered. The frame reports also include browser requestAnimationFrame cadence.

| Build | Viewport | WebGL draw frames/s | Median interval (ms) | p95 interval (ms) | First WebGL submission | End state |
| --- | --- | ---: | ---: | ---: | --- | --- |
| before | 390×844 | 37.1 | 16.7 | 50.1 | Ready before input | Live canvas remained |
| before | 1440×900 | 19.9 | 16.8 | 100.1 | Ready before input | Fell back to still composition |
| after | 390×844 | 10 | 16.7 | 333.4 | 389 ms | Live canvas remained |
| after | 1440×900 | 12.2 | 50.1 | 200 | 361 ms | Live canvas remained |
