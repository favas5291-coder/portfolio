# Gate 1 · Passenger seat to pavement

[Matched 390 px and 1440 px bookends](bookends.jpg) · [Uncut phone-viewport reversal](phone-reversal.mp4) · [Construction details](material-details.jpg) · [Camera checks and individual screenshots](visual-checks.md)

The local React homepage renders the approved first-frame introduction and project/contact links before loading Three.js. Its authored Blender hatch, studio shell and rain tree share one measured set. Both cameras look through the open timber screen. The guest sees both kerb-side wheels beyond the desk. Reception and the upper route have the surfaces needed to reach the guest camera. Their full architectural furnishing and project-to-monitor inspection are later work.

## What changed during review

| Visible problem in the first pass | Correction in this proof |
| --- | --- |
| The passenger door read as a narrow bright line. | Raised and shaped the inboard padded rail, modelled its stitched edge and moved the mirror 90 mm aft. The rail now anchors the lower portion of the seated view. |
| A large sign on a slab competed with the upstairs window. | Set a glazed bay deep into the lower façade, fixed individual letters to the lime beam, reduced the apparent masonry scale and offset the screen from the entry canopy. |
| The background contained blurred city buildings and the wet paving picked up a pink highlight. | Isolated the cloud sector of the post-rain HDRI, built the adjoining garden and opposite verge in geometry, and used a low-resolution reflection of the actual building in bounded puddles. |

A separate motion defect showed up in the mesh sweep. The entrance closer crossed the visitor's eye just past the threshold. Its closing stroke now starts after the visitor clears the glass. Both eye-to-wheel rays clear the solid façade and furniture at the final chair position. [Sampled clearances and GLB hashes](clearance.json)

## Architectural judgment

- **Team Thai.** The open court lets a low branch enter the street composition while the forward screen shades the office. The open leaf, hinge and deep reveal read in the reverse view. The close inspection shows the continuous tree fork. The smallest foliage still reads as cards in some light. [Stapati](https://stapati.com/projects/team-thai/)
- **Renzo Piano Pavilion.** A low canopy projects 1.80 m and stops short of the guest-to-wheel sightlines. Recessed glass and timber soffit catch different amounts of the western light. A slotted drain marks the switch from broken wet reflections to dry stone. The compact interior has less variation in indirect light than the photographic reference. [Kimbell](https://50.kimbellart.org/architecture/the-renzo-piano-pavilion/)
- **The Silence Museum.** Native scrolling moves the eye, then the equal camera stops give the visitor a stationary façade and desk. The hold makes the window and car available for quiet inspection with sound off. Reception's final transition into an enlarged, accessible GymDrobe monitor belongs to Gate 2. [Undream Studio](https://www.undreamstudio.com/projects/the-silence-museum/)

## Rendering decision

The three optimized GLBs total 9,439,364 bytes. The deferred HDRI is 197,316 bytes. KTX2 texture data and meshopt-compressed geometry are embedded in the models. Static diffuse bounce and ambient occlusion use a secondary UV atlas on the architectural receivers. The doors cast live shadows. The opening still and HTML can be used while the models load. These file sizes exclude the renderer, decoder, project capture and stills.

The [Cycles comparison](cycles-passenger-390.webp) uses the same passenger eye, vertical lens, foreground car and façade as the compact live view. It was rendered at 390 × 386 using 64 samples on CPU with offline denoising. Fine wood and highlights also soften at this size. The browser captures are from software rendering. A representative physical phone still needs measurement before choosing full-length live motion. The uncut software-rendered recording delivered 53 compositor frames in 60.71 seconds under capture. It demonstrates position and reversal, with visible stalls. For the next phone proof, use the tested encoded exit. Its compact clip costs 741,811 bytes and the wide version costs 1,576,514 bytes. On a warm local connection, p95 scroll-to-presented-frame time was 16.7 ms across forty discrete emulated phone seeks. The same frame decoded identically on forward and reverse visits. This is a separate [media comparison](media-proof/README.md) with an [uncut reverse-seek recording](media-proof/reverse-seeking-390.mp4).

The local noindex production bundle passed `npm run verify`. All 77 individual tests passed. The build prerendered eleven routes plus the 404 page and reported 90.8 KiB gzip for the initial homepage JavaScript. On both reviewed viewport sizes, headless Chromium opened the page, decoded the three compressed GLBs and reached the office at normalized progress 1. Reduced motion at 390 px requested zero model, decoder or HDRI bytes. [Production-bundle browser check](renderer-smoke.json)

[Assets, authors, modifications and rights](ATTRIBUTION.md) · [Rebuild and tuning instructions](../../../README.md)
