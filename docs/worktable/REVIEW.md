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

To reproduce the downloadable homepage, run npm run build followed by node scripts/build-worktable-review.mjs. Open .sites-runtime/Fazhere-Worktable-Preview.html in a browser. It bundles the visuals, fonts and code in one file. Other pages and external links use their live destinations. Use the full branch preview to review the revised case-study route.
