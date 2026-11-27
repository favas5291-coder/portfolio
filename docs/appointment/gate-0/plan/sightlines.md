# The two views

These are original Gate 0 drawings for a virtual building in Kozhikode. [Plan](bookend-plan.png) · [Section](bookend-section.png). The tests below use proposed dimensions and pinhole-camera projection. Material quality, recognition on a real phone and final mesh clearance require Gate 1 evidence.

## Setting out

All coordinates are metres in (east, north, up). The origin lies at the west end of the south elevation at road level. Sidewalk, reception and the courtyard start at +0.14 m. The upper floor sits at +3.40 m. The hatch faces east in the near traffic lane. Its left-hand passenger side faces the entrance.

| Element | Dimension or position |
| --- | --- |
| Shell | x 0–10.20, y 0–7.25. A street-facing courtyard cuts into the west end. Main façade thickness 0.32 m. |
| Road and car | Kerb at y −5.50. Hatch body x 4.25–8.55, y −7.58 to −5.82. Wheelbase 2.72 m. Kerb-side hub centres at (5.03, −5.79, 0.32) and (7.75, −5.79, 0.32). Recess the rocker behind the outer tyre faces. |
| Passenger camera | (7.02, −6.23, 1.13). Side glass at y −5.81, clear x 6.44–7.69, z 0.91–1.43. Roof envelope +1.51. Visible mirror edge at (7.58, −5.47, 1.05). |
| Entrance | Entry centre at (4.03, 0), clear width 1.24 m inside the framed doorway. Dry canopy x 2.80–5.00, y −1.80 to 0, soffit +2.90. Support at the jambs. |
| Office glazing | x 5.42–7.86, z 3.66–5.57. Fixed safety glass, low solid sill and no transverse rail. Exterior screen plane y −0.16. Fixed leaves at the ends. Clear space x 5.98–7.27. The 1.29 m hinged leaf stays folded out at the east jamb. Amber hardware at the hinge identifies it from either side. |
| Guest and furniture | Eye (6.55, 1.30, 4.60). Desk x 6.95–8.28, y 0.08–0.80, top +4.15. Monitor x 6.98–7.42 near y +0.12. The guest looks past the west end of the desk. The nameplate sits along that corner. |
| Rain tree | Trunk centre (1.72, 1.83) in the unroofed courtyard. Approximate DBH 0.42 m; root flare and buttresses need more ground clearance. Sweep a lower limb out through the open front of the court, above the +3.13 m canopy cap, reaching (6.00, −1.15, 4.50). Its projected centre falls at x 5.77, z 5.26 against the façade, over the fixed west screen. |
| Stair and table | Half-landing y 3.80–4.68 at +1.77. Meet a lateral branch near eye level +3.37. The project table x 4.35–5.90, y 4.67–5.48 lies in a top-lit void. Get to the office via the north and east gallery. Keep the table sightline open with the final balustrade. |

The entry opens from wet paving to dry reception. The project monitor faces the arrival from an angle, beside the table in the void. The working studio is behind reception, under the north gallery. The twin-flight stair rises beside the court. The gallery turns east and then south to reach the guest chair.

## Clearance checks

The passenger-to-screen ray crosses the side glass at (6.994, −5.81, 1.368). It clears the proposed head seal by 62 mm. The entrance-centre ray crosses at (6.818, −5.81, 1.159). The roof and A-pillar therefore leave both targets visible within this aperture. The branch passes above and to the west of the opening.

At the outside wall face the returning wheel-hub rays cross x 6.27 and 6.77 at +3.815 m. The bottom of the tyres at +0.03 m crosses at +3.762 m, leaving 102 mm above the solid sill. At the separate exterior screen plane, wheel centres pass through the open bay at x 6.237 and 6.797. Keep the sill flashings to the wall face and omit a bottom rail across the open screen bay. At the canopy's outer lip the western hub ray passes x 5.885, leaving 885 mm beside the canopy. The 0.75 m desk starts at x 6.95, leaving at least 180 mm beyond the eastern wheel ray across its footprint. Later furniture, foliage, trim and signage must preserve this volume.

For the car exit, rotate a 1.45 m door around the vertical hinge at (7.83, −5.81). The rear tip opens north towards the kerb. Sample these eye centres in sequence. Stand up after crossing the sill. Hold the open door, then have the visitor draw it closed after clearing the swing and before leaving the pavement. This leaves the side and wheels legible in the last shot. Set the closing stroke from scroll progress so reverse travel opens it again.

| Stage | Eye (x, y, z) | Door |
| --- | --- | --- |
| Seated | 7.02, −6.23, 1.13 | 0° |
| Turn towards opening | 7.00, −6.15, 1.10 | 51° |
| Dip below frame | 6.90, −5.92, 1.10 | 63° |
| Cross sill | 6.82, −5.50, 1.12 | 68° |
| Rise on pavement | 6.78, −5.13, 1.28 | 68° |
| Hold façade | 6.66, −4.90, 1.74 | 68° |

At 101 samples per linear segment, a 0.12 m eye-centred sphere clears the swept 0.13 m thick door envelope by at least 235 mm. It clears the +1.40 m roof underside by 150 mm while horizontally overlapping the roof. It clears the kerb top by at least 854 mm while crossing the edge. These are eye-volume checks. Gate 1 must check the camera near plane, mirror, pillars, visor, steering and door furniture against the authored meshes at intermediate poses in both directions. Replace the construction polyline with a smooth parametrized eye path and re-run the check.

## Framing and HTML

Both layouts keep the eye positions fixed. Yaw is clockwise from north, pitch is positive up and roll is zero. The desktop proposal reserves a 960 × 750 scene inside 1440 × 900. The phone reserves a 390 × 386 scene inside 390 × 844. This leaves 458 CSS px for the header, live HTML identity and service promise, genuine project preview, two contact/project actions, scroll cue and safe-area insets. Keep this information in document flow above and below the image. Adjust scene height for a short visual viewport, and re-fit the lens if its aspect changes. Validate text wrapping, target size and control reach against the actual browser and installed font at Gate 1.

| Hold | Yaw / pitch | Vertical FOV at desktop / phone |
| --- | --- | --- |
| Passenger | 4° / +5° | 69° / 72° |
| Guest | 169° / −16° | 57° / 62° |

Projected anchors below are fractions of the scene rectangle from its upper-left corner. They include the perspective division. At phone size the entry and upstairs marker fall roughly 118 CSS px apart horizontally and 127 px vertically. The two wheel centres fall about 114 px apart. The east-side desk projects to camera-left.

| Subject | 960 × 750 (x, y) | 390 × 386 (x, y) |
| --- | --- | --- |
| Near sill | 0.458, 0.967 | 0.450, 0.942 |
| Mirror edge | 0.865, 0.638 | 0.937, 0.630 |
| Entry | 0.177, 0.511 | 0.113, 0.511 |
| Lit panel | 0.428, 0.165 | 0.413, 0.183 |
| Near-side wheel hubs | 0.770, 0.776 and 0.516, 0.743 | 0.809, 0.749 and 0.518, 0.719 |
| West and east bumper | 0.852, 0.750 and 0.447, 0.700 | 0.903, 0.726 and 0.439, 0.681 |
| Monitor horizontal span | 0.148–0.383 | 0.098–0.366 |

To reproduce an intersection at depth y, take the eye point plus the eye-to-target vector scaled by (y − eye.y) / (target.y − eye.y). For the projected coordinates, rotate the same vector into camera space, divide its horizontal and vertical components by forward depth, then scale by the aspect and vertical field of view. A later change to the bay, kerb, canopy, screen, guest chair or camera stage must repeat both tests.
