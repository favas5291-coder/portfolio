# Favas’s worktable

This review branch starts at main f72d42b, includes the service demonstrations and enquiry draft from PR 5 (9f51e2b), and builds a new opening around a physical desk. PR 3 brought the five abstract WebGL scenes to main. PR 4 addressed mobile title contrast. The opening on main used an abstract sculpture, a general headline, and two tour choices. Its scene director did not mount the existing character rig. The previous proof card in PR 5 improved access to GymDrobe, but remained separate from the animated set.

Flux Theory opens with one full-frame visual subject and a quiet action at the edge of the frame. The worktable uses that timing principle with original orange lighting, a rounded desk screen and a personal greeting. No reference-site assets are used.

| Chapter | On screen | Favas | Visitor action and transition |
|---|---|---|---|
| Welcome | A charcoal desk terminal turns a wireframe into a real GymDrobe capture. | Looks up, smiles and waves, then looks across at the screen. | Inspect the capture, enter the narrated tour or scroll into the workshop. |
| Services | The terminal responds to the selected offering. | Looks first and presents the selection. | Build a homepage, change a sample variant, try an enquiry or compare layouts. Carry the service into the brief. |
| Projects | The presentation becomes a flat, inspectable desktop or phone capture. | Points to GymDrobe and settles. | Switch devices, enlarge, and try the verified shopping detail. |
| Process | A paper brief becomes a scoped plan, preview, review and handover. | Introduces each deliverable. | Select a stage to see what a client receives. |
| Contact | The screen displays the visitor’s selected project type. | Opens his hand to invite a conversation. | Edit a private draft and open the existing WhatsApp or email destination. |

## Editing the studio

Edit the project narrative, destinations and contribution in src/data/portfolio.js. The desktop screenshot still reads src/data/project-previews.js and uses the existing preview:update command. For the phone view, capture the real store at phone width and replace the mobileCapture reference in src/components/Worktable.jsx with the new dated image. Update the capture date in src/App.jsx. The two local shirt photos come from the actual COITONIC black and red card images observed on 2 November 2026.

Edit scripts, caption durations, highlight IDs, service/stage cues and optional local audio URLs in src/guide/tourConfig.js. The 63-second figure is the caption timeline. A device voice or recorded clip sets its own playback duration. The temporary character uses separate joints, eye movement, breathing, a wave, presentation gestures and approximate mouth movement. A final photo-matched head sculpt, facial blendshapes, timed visemes and recorded voice remain to be supplied.

To reproduce the downloadable homepage, run npm run build followed by node scripts/build-worktable-review.mjs. Open .sites-runtime/Fazhere-Worktable-Preview.html in a browser. It bundles the visuals, fonts and code in one file. The case study, services and contact pages open inside the same file. External websites, email and WhatsApp use their normal destinations.

## Verification

The production build prerendered all nine routes and the 404 page. All 54 tests passed. Chromium rendered WebGL at 360, 390, 430, 768, 1024, 1440 and 1920 CSS pixels with no horizontal overflow. The browser checks exercised desktop/mobile selection, enlargement, Escape, colour selection, the service handoff, tour navigation, dismissal, replay, reduced motion and a deliberately unavailable WebGL context. The Windows/Android/iPhone system voice, physical-device frame pacing and final likeness still need human review.

The matched run on commit 0e30e02 used a fresh Chromium context at 390 × 844, 1× DPR, local production builds and no throttling. Median of three cold navigations:

| Measure | Main | Worktable |
|---|---:|---:|
| Initial home JavaScript, gzip | 83.0 KiB | 87.9 KiB |
| First contentful paint | 88 ms | 120 ms |
| Largest contentful paint | 88 ms | 176 ms |
| Cumulative layout shift | 0 | 0.088 |

These are synthetic, local-server measurements. They do not establish real network or handset performance. The desktop imagery continues through the existing preview manifest. The real mobile screenshot and two demonstration photos are dated manual captures. The public product detail page failed to load during the live check, so the new observed-result claim covers only the featured collection card.

The PR’s Cinematic visual review artifact includes the seven opening screenshots, the two inspection views, a screen recording and the measurement JSON.
