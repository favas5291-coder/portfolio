> Freelance service pages and enquiry update: see [deployment steps](docs/SEO-DEPLOY.md) and [SEO report, page metadata and 30-day plan](docs/SEO-REPORT.md). The Render site uses real static pages; remove an old SPA catch-all rewrite before verifying missing-page status codes.

# Favas — The Forge

A scroll-driven portfolio for **Muhammed Favas K**, built with React, Vite, Tailwind CSS, Three.js, React Three Fiber, drei, React Three Postprocessing, GSAP/ScrollTrigger and Lenis.

The Forge is one fixed 3D world behind semantic HTML. A mechanical assembly separates into its working parts, becomes a screen for GymDrobe, then comes back together. The complete portfolio remains usable in a lightweight 2D mode.

## Start locally

Use Node.js **22.12 or later**. Extract the ZIP and open a terminal inside `favas-the-forge`.

```bash
npm ci
npm run dev
```

Open **http://localhost:4173**. Stop with `Ctrl+C`.

```bash
npm run build
npm run preview
```

The final static site is in `dist/`. The build prerenders all portfolio text and links into HTML, then hydrates the React interactions. No backend, database, API key or environment variable is needed. The contact action opens an email client; no unconnected form is included.

## Scroll timeline

Camera positions and scene poses live in `src/data/portfolio.js`.

| Chapter | Camera x, y, z | Assembly behavior |
| --- | --- | --- |
| Home | 0, 1, 8 | Parts assemble on entry; code core, plates, rings and cables |
| About | 2, 0.5, 5 | Camera moves closer; the assembly separates |
| Skills | -2, 1, 6 | Parts spread; React, Node, Express, MongoDB, Tailwind and Git are selectable |
| Projects | 0, 0.5, 6 | A screen appears with the real GymDrobe storefront texture |
| Contact | 0, 1.5, 9 | Parts reassemble as the camera pulls back |

Scroll progress is interpolated between the actual HTML chapter positions. Mobile adjusts the camera distance and centers the object. The canvas stays fixed; content is never locked behind a scroll animation or interaction.

## Edit content

**`src/data/portfolio.js`** is the single content file.

- `profile`: name, role, introduction, story, location, contact and optional LinkedIn/CV links.
- `chapters`: navigation labels and chapter titles.
- `skillGroups` and `skills`: grouping, application descriptions and code references.
- `project`: all GymDrobe case-study content, features, stack, links and evidence note.
- `cameraTimeline`: camera, object rotation, position and separation per chapter.

LinkedIn and CV are empty and hidden. Add only a valid destination. To add a CV, place the actual PDF in `public/files/` and set `profile.cv` to `/files/your-cv.pdf`.

The supplied, real project image is **`public/images/gymdrobe-storefront.webp`** (1348 × 926). It is used both as a 3D screen texture and as an accessible HTML image with an enlargement dialog. No replacement screenshot is required. A new screenshot should preserve this aspect ratio, or the device plane proportions should be updated in `src/scene/ForgeScene.jsx`.

For personal metadata changes, also edit `index.html` and the social card in `public/`. To change only the deployment origin:

```bash
node scripts/set-site-url.mjs https://your-domain.com
npm run build
```

The command updates canonical/social URLs, robots and sitemap. The source assumes deployment at the domain root.

## Vercel deployment

1. Create a separate GitHub repository for this portfolio and push the extracted files, including `package-lock.json`.
2. Import that repository into Vercel.
3. Select **Vite**, install command **`npm ci`**, build command **`npm run build`**, and output directory **`dist`**. Use Node.js 22.12 or later.
4. Deploy, add your domain if needed, and run the domain-update command above before the next deployment.
5. Test the public URL while signed out before sending it to recruiters.

No rewrites are required for this single page with hash navigation.

Official reference: https://vercel.com/docs/frameworks/frontend/vite

## Netlify deployment

1. Import the same portfolio repository in Netlify.
2. Set the build command to **`npm run build`** and publish directory to **`dist`**.
3. Use Node.js 22.12 or later. The included `netlify.toml` supplies the build/output settings and Node 22.
4. Deploy and update the canonical origin using the command above.

Alternatively, run the build locally and upload the contents of `dist/` using Netlify's manual deployment workflow. Do not upload the source folder as the published output.

Official reference: https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/

The ChatGPT-hosted preview remains owner-private. Public hosting and domain setup are independent of that preview. Open Graph crawlers require a publicly accessible site.

## Performance and fallback

- Three.js, R3F, drei and postprocessing are isolated in a lazy scene chunk. GSAP and Lenis also load separately.
- The assembly is procedural geometry, so there is no downloaded model or Draco decoder. Repeated fasteners use an instanced mesh. If replacing this with a GLB, export with meshopt or Draco and configure the corresponding loader.
- Pixel ratio is capped at 1.5. Geometry uses modest segment counts; shadows use a 1024px map. Bloom is limited to desktop and uses a high luminance threshold; orange emissive elements provide the intended highlight.
- Demand rendering stops after the assembly settles. Scroll/pointer input wakes it. A hidden tab sets the canvas frame loop to `never`.
- Reduced motion, Save-Data, devices reporting 4GB memory or less / 4 logical cores or less, failed WebGL, and a loading timeout select the 2D view. Visitors can opt into 3D on a capable low-power device. A manual 2D preference is saved locally.
- Loading progress uses actual Three loader item counts. The loader never blocks HTML content and can be skipped. No simulated percentage is used.
- Fonts are self-hosted, subset WOFF2 files. The project screenshot is WebP. The studio environment is a local 1K HDRI.
- Text, chapter links, features, case-study disclosures and email links remain available without WebGL and without JavaScript. The image itself remains visible without JavaScript; its enlargement requires JavaScript.

**60fps on a mid-range phone and Lighthouse 85+ are targets, not measured results.** The provided cloud browser disables WebGL and does not expose a Lighthouse runner. Responsive content and fallback behavior were checked there; the 3D lighting, shader output, camera framing and GPU frame rate still need a WebGL-capable device check. See `docs/VERIFICATION.md` for exact validation scope.

## Accessibility and interaction

Use the visible Home, About, Skills, Projects and Contact links for direct navigation. Tab / Shift+Tab move between links and buttons. Enter / Space activate skill buttons. Native case-study disclosures support the keyboard, and the native screenshot dialog handles focus and Escape.

System reduced motion disables the 3D world and GSAP motion. There is no audio, hover-only content, tracking, progress score or contact-form service. Clipboard failures show an accurate fallback message and retain the working email link.

## Source map

| File | Purpose |
| --- | --- |
| `src/App.jsx` | Full semantic page, nav, skills, case study, contact and scene boundary |
| `src/styles.css` | Art direction, responsive layout, focus and reduced-motion styles |
| `src/data/portfolio.js` | Editable profile, project, skill and camera data |
| `src/hooks/useExperience.js` | Scroll position, navigation, capability detection and view preferences |
| `src/motion/setupMotion.js` | Lenis, GSAP reveals, custom cursor and magnetic buttons |
| `src/scene/ForgeScene.jsx` | The single R3F world, materials, assembly and transformations |
| `src/components/ForgeFallback.jsx` | Lightweight vector illustration for the 2D experience |
| `src/main.jsx` / `src/entry-server.jsx` | Client hydration and build-time HTML rendering |
| `scripts/prerender.mjs` | Emits all content into the production HTML |
| `scripts/set-site-url.mjs` | Updates the site origin in SEO files |
| `public/` | Real screenshot, HDRI, fonts, licenses, favicons and social image |
| `docs/VERIFICATION.md` | Content evidence and test results / limitations |

The source ZIP contains complete replacements for all changed application files plus all new files and assets. It excludes dependencies, build output, private host identity, QA harnesses and credentials. `docs/CHANGES.md` lists replaced, added and retired files compared with the previous Developer Quest edition.

## Asset attribution

- The assembly and fallback illustration are original code-based geometry.
- Studio Small 09 HDRI by **Sergej Majboroda**, Poly Haven, CC0: https://polyhaven.com/a/studio_small_09
- Syne and IBM Plex Mono: Google Fonts, SIL Open Font License. License files are included in `public/fonts/`.
- GymDrobe screenshot: captured from the supplied public storefront on 22 October 2026. No account, payment or privileged admin workflow was exercised.
- Dependency licenses remain with the installed packages.
