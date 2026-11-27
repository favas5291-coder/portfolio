# The view through the guest window

[Matched desktop and phone frames](bookends.jpg) · [Projected sightlines](sightline-guides.jpg) · [Phone exit and reversal](phone-reversal.mp4)

| Viewport | Passenger seat | Guest chair |
|---|---|---|
| 390 × 844 touch emulation | [Opening](passenger-390.png) | [Return](office-390.png) |
| 1440 × 900 desktop | [Opening](passenger-1440.png) | [Return](office-1440.png) |

At the passenger seat, a continuous dark belt and the mirror bound a view of the entrance and one lit upstairs bay. The low branch runs toward the folded timber leaf. In the guest view, the desk and its GymDrobe display occupy the left side of the glass. The opening to the right gives the whole car a readable profile against the kerb. The physical sill, front fascia and desk edge remain in the two shots.

## Construction details

[Contact sheet](material-details.jpg) · [Door trim](door-trim.png) · [Wet and sheltered floor](threshold.png) · [Window reveal](screen-reveal.png) · [Branch collar](branch-junction.png)

These close-ups use inspection cameras in the same renderer and load the same set of GLBs as the visit. The door has a rubber glass seal, rolled belt, stitched trim and a recessed release lever. The threshold detail includes the drain at the dry apron and reflected fragments on the exposed paving. The final lighting pass reduced a saturated pink highlight on the damp street. The folded timber frame has a box-section perimeter, separate blades, amber hinge hardware and a deep wall reveal. The rain tree's fork shows continuous bark across the change in direction. The trim is dark in the shaded cabin and some surfaces and distant planting still have a simplified finish.

## Camera clearance

The check decodes the exported triangles, preserves node transforms and samples the actual camera spline and animated hinges at 2,001 progress values. Reversing the same values reproduces all sampled camera positions, orientations, vertical lenses and both hinge angles exactly. The head sphere has a 120 mm radius. The camera's 25 mm near plane fits inside a 37.5 mm sphere at either reviewed aspect ratio. [Measured distances and asset hashes](clearance.json)

| Part of path | Minimum distance from eye to mesh | Clearance beyond head sphere |
|---|---:|---:|
| Fixed car at and above the headliner datum | 287 mm | 167 mm |
| Moving passenger door and trim | 304 mm | 184 mm |
| Pavement and kerb during exit | 976 mm | 856 mm |
| Moving entrance door and handle | 527 mm | 407 mm |
| Entire path, nearest upper-route plaster face | 130 mm | 10 mm |

The first sweep found the entrance glass within 2 mm of the eye as its closer returned. Delaying the closing stroke until the visitor had cleared the swing produced the measured 527 mm. The full-path near-plane margin is at least 92 mm at the sampled poses. These samples cover the route at steps of 0.0005 progress. The 10 mm full-path head margin is tight enough to warrant rechecking when furnishing the upper route.

The two outgoing rays cross the side glass without touching the upper door frame, roof or a branch. Rays from the guest eye to the two visible wheel faces and lower tyres first pass through the office safety glass and then reach aluminium or tyre rubber. At phone size the projected hub centres are about 113 CSS pixels apart across the 390-pixel view. A ray precisely through the hollow centre of a hub is unsuitable for identifying its mesh, so this check also samples a point 21 mm off each hub axis.

## Capture conditions

Full-frame screenshots use the ordinary local built homepage, its standard interaction path and the visible canvas. Chromium ran headlessly with ANGLE SwiftShader on Linux. The phone context uses a mobile Chrome user agent, touch input, 390 × 844 CSS pixels and DPR 1. The desktop uses 1440 × 900 and DPR 1. Each session uses normal motion preference.

The uncut recording starts after the live model is ready. The input harness dispatches native touch events to open the door, reverses while crossing the sill, then resumes and walks through the front door. Chromium's compositor supplies timestamped frames. The recording reached normalized progress 0.105 at scrollY 189, returned to 0.040 at scrollY 72, then reached 0.105 again at the same scrollY 189. It continued to 0.200 on the pavement and 0.400 inside the entrance. All six sampled landmarks used the live renderer. [View from the open sill](sill-crossing-390.png)

The screencast delivered 53 compositor frames during 60.71 seconds, fewer than one captured frame per second. The H.264 file contains 1,585 frames at 25 fps over 63.40 seconds. The encoder repeated the available frames, including about 2.69 seconds of extra final-frame hold. A full decode with FFmpeg's freeze detector at −50 dB found a 4.32-second interval with negligible change between 43.68 and 48.00 seconds. The interval includes any deliberate hold and capture overhead. These conditions show the order and reversal of movement but give visibly stepped playback. The workstation was also rendering other local evidence. Physical-device motion and human recognition remain unmeasured.

[Phone capture record](capture-390.json) · [Desktop capture record](capture-1440.json)
