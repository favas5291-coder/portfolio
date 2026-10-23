# Complete replacement guide

This edition replaces Developer Quest with The Forge. Extract the full source into a new folder for the cleanest setup. Every listed file is provided in full, not as a patch.

## Replace

- `src/App.jsx`
- `src/styles.css`
- `src/data/portfolio.js`
- `index.html`
- `package.json`
- `package-lock.json`
- `README.md`
- `docs/VERIFICATION.md`
- `public/favicon.svg`
- `public/favicon-32.png`
- `public/apple-touch-icon.png`
- `public/social-card.svg`
- `public/social-card.png`

## Add

- `src/hooks/useExperience.js`
- `src/motion/setupMotion.js`
- `src/scene/ForgeScene.jsx`
- `src/components/ForgeFallback.jsx`
- `public/environment/forge-studio.hdr`
- `public/fonts/` (all font files, stylesheet and licenses)
- `netlify.toml`
- `vercel.json`
- `docs/CHANGES.md`

## Retire

These files are no longer imported and are omitted from the new source:

- `src/hooks/useJourney.js`
- `src/utils/exploration.js`
- `src/components/Robot.jsx`
- `src/components/Workspace.jsx`
- `src/components/TechIcon.jsx`

The existing real GymDrobe screenshot, client/server entries, Vite configuration, prerender helper, domain-update helper, robots and sitemap are retained. Reinstall with `npm ci` after replacing the package files. Old visitor badges/progress are no longer read; the redesign stores only an explicit view preference under `forge-view`.
