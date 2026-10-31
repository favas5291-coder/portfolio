# FAZHERE cinematic world — October 31, 2026

## Creative direction

**One explorable creative atelier, not a static developer landing page.**

The earlier hero had a large heading next to a standing mannequin. This rebuild uses one continuous WebGL studio with a room, lighting, five authored stations, animated camera movements and an articulated guide. The story is Welcome → Services → Projects → Process → Contact.

The implementation uses only the existing React 19, React Three Fiber, Three.js and browser capabilities. It introduces no API keys or paid add-on services.

## Architecture / sources of truth

- `src/App.jsx`: semantic portfolio story, accessible selection controls, tour controls, modal, actual project and contact information
- `src/cinema/StudioWorld.jsx`: one deferred 3D renderer, physical studio architecture, camera route and stations; reacts to chapter and service/process choices
- `src/cinema/CinematicPortfolio.css`: deliberately different desktop/mobile compositions and readable content
- `src/guide/GuideCharacter.jsx`: temporary procedural character; added walking gait, staged body and gaze anticipation
- `src/guide/tourConfig.js`: authoritative chapter narration text and timing
- `src/data/site.js`: actual services and process descriptions
- `src/data/portfolio.js`: actual GymDrobe data, public project destinations and contact details
- `src/data/project-previews.js`: real, automatically refreshed project screenshot reference; update automation unmodified

Other routes remain in the pre-existing marketing pages and SEO configuration.

## Visitor journey

1. **Arrival:** rendered 3D workshop, physical desk / monitor / windows / lamps; the guide turns to visitor, waves and settles into a calm presentation; voice does not autoplay.
2. **Services:** four touch/keyboard-selectable services share the original `services` data; miniature concept studio objects respond to selection; they are *not* representations of completed client commissions.
3. **Projects:** real screenshot of GymDrobe, actual code and case-study links, implemented contribution, optional engineering notes; project image opens in an inspectable dialog.
4. **Process:** the documented five stages drive one 3D workbench with moving components. Every stage is also usable with buttons and visible written copy.
5. **Contact:** the room opens toward a warm-lit doorway; actual configured contact destinations remain usable and the tour can be replayed.

No scroll-jacking: normal scrolling, anchored navigation and reverse movement work. A paused tour yields camera control to independent navigation.

## Mobile and fallback

The CSS repositions the content on mobile and reduces type / control dimensions. The 3D camera adapts to screens below 720 px. WebGL is code-split and loaded after the semantic page; a non-3D fallback/background remains. Reduced-motion requests shorten camera changes and disable decorative CSS motion.

## Honesty about what is not finished

**The procedural character is still a temporary reference-inspired model.** It is not a finished photo-matched likeness. Rigged face, physical articulation, convincing gait, custom wardrobe detail, voice quality and phoneme/viseme synchronization all require further specialist assets and visual testing. Existing speech activity is *not* true lip sync. No user-uploaded photo has been converted into a real 3D model by this commit.

**The new 3D space also needs hands-on visual review.** CI can confirm source tests, production compilation, HTML prerender and asset/link checks but cannot establish art direction, interaction timing on actual devices or fidelity to the user's photo. Do not label the cinematic experience “final” based on unit tests alone.

## Verification checklist before production

- GitHub CI: `npm ci && npm run verify`, including the 55 test cases and production static route checks
- Desktop: 1024, 1440, 1920 widths — camera and actor framing; verify no geometry clips or blocks authentic project links
- Mobile: 360, 390, 430, 768 widths — touch selections, first viewport, reduced-motion layout, portrait and landscape
- Safari iOS and Chrome Android — audio opt-in, animation, visibility pause, performance, battery
- Keyboard: tab order, focus, escape dialog, chapter jumps, skip link and controls
- 3D fallback: disable WebGL, let all service/project/contact information remain available
- Check client performance and Core Web Vitals. The deferred world bundle includes the 3D renderer; a Vite chunk-size warning is not a measured performance metric.
- Final 3D character likeness and real viseme rig need separate acceptance and a side-by-side review against the consented reference photo.

## Editing

Update services and process in `src/data/site.js`; update the real GymDrobe case study in `src/data/portfolio.js`; update tour scripts in `src/guide/tourConfig.js`. When a genuine custom GLB with appropriate motion clips and facial targets is available, set `characterAsset.model` and validate animation mappings. Keep the temporary character status until that verification passes.

This branch must be reviewed before merging to `main` or changing the production site.
