# FAZHERE — five states of an idea

## Intent and reference

Reference supplied by owner: https://www.fluxtheory.in/

The accessible reference page documents five distinctly themed identities (Sport, Sage, Dreamer, Lover and Rebel), each with focused introductory copy. That thematic storytelling informed the **principle** of giving each portfolio chapter its own authored visual identity. The exact choreography, WebGL implementation and timings of the reference were **not** independently verified in a real browser and are not claimed here.

FAZHERE uses an original concept: **the five states of an idea** — Spark, Shape, Proof, Make, Next. It does not copy Flux Theory products, image assets, brand names, typography composition or scene geometry.

## Implemented / code map

- `src/cinema/ImmersiveWorld.jsx`: one R3F Canvas with five physical scenes, dynamically shaded materials, orbiting geometry, deterministic instanced particles and a smooth camera that follows normal page scroll progress. The primary environment and subjects are actual WebGL geometry, not GIFs or CSS backgrounds.
- **Spark**: metal and iridescent orbital ribbons around a sculpted idea core.
- **Shape**: 42 3D modular interface fragments react to actual service selection, without inventing client work.
- **Proof**: the existing GymDrobe screenshot, sourced from `src/data/portfolio.js`, is projected unmodified onto a 3D presentation screen, and the accessible HTML details/link actions remain available.
- **Make**: 54 geometric components assemble in response to the real 5-step collaboration process from `src/data/site.js`.
- **Next**: warm, reflective multi-loop portal and concluding contact invitation.
- `src/cinema/ImmersiveChapters.css`: original warm/teal/violet/copper/rose visual identities and intentional distinct small-screen composition.
- `src/App.jsx`: one editable semantic narrative, real services and process descriptions, authentic case study, website/source links, actual contact details, tour and accessibility controls.
- Existing `src/seo/pages.js`, `src/data/project-previews.js` and secondary pages remain the source of truth.

## Accessibility, maintenance, and performance

3D loads only after the initial static page hydrates; all important copy, project screenshots and destination links remain usable without WebGL. There are controls for independent exploration, opt-in voice/captions, reduced motion and switching off the animated environment. Document visibility pauses the render loop. Device pixel ratio is capped.

Update service/process data in `src/data/site.js`; GymDrobe case-study data and screenshot in `src/data/portfolio.js`; voice segments in `src/guide/tourConfig.js`. Do not insert fake client projects.

## Not implemented / not verified

- The existing procedural man is visually rejected; this branch removes it from the primary scenes. A **photo-matched, professionally rigged Favas likeness** with expressive animations and actual viseme synchronization remains unimplemented. The opt-in tour can use existing browser speech synthesis with captions but does not imply voice cloning.
- No paid visual assets or model generation services were introduced.
- Core Web Vitals on real hardware and iOS/Android touch/voice timing have not been validated by desktop CI alone.
- Browser renders, screenshots, interaction and animation QA must be reviewed before production. Screenshots from the GitHub Actions visual review run are the actual browser render, not concept mockups.
- The prototype can be artistically improved; passing build and screenshot tests alone does not establish reference-equivalent cinematic fidelity.

## Acceptance / visual QA

Review real browser captures at 390×844, 768×1024 and 1440×900 for each of five chapters, plus real iPhone Safari and Chrome Android. Verify scroll-forward/backward, reduced-motion, keyboard focus, service selection, process selection, authentic screenshot, project links, contact buttons, and WebGL unavailable/lost. Confirm normal SEO and static HTML prerender tests.

Do not merge this PR solely because CI passes. Visually approve the result first.
