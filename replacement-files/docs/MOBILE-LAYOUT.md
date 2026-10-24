# Mobile hero layout update

## What changed

The previous mobile overrides put the business copy directly below the name, over the sculpture, with a dark gradient behind it. A full-width fixed WhatsApp strip was also visible from the first screen.

The introduction is now a single `business-introduction` section, immediately after the complete `hero-visual` section and before About. Mobile keeps the name, developer role, scene space, compact View My Work link and hero footer together. The business section uses the existing black, off-white and orange palette with smaller type and normal-flow spacing.

The same single copy of the content occupies the original desktop composition using CSS Grid. It is not duplicated, moved by JavaScript or conditionally inserted after hydration. The descriptive H1 remains in the prerendered HTML, with its original text, links and metadata.

The WhatsApp strip is replaced with a 50px icon with an accessible label and a 44px+ touch target. It respects safe-area insets, stays hidden while the hero is visible, and is available after the hero where it has clear space. It temporarily hides when its footprint would cover text, images, links, form fields, scene controls, the header or footer. Ordinary contact buttons remain available in the introduction and Contact section.

The icon caches its collision targets and schedules at most one measurement frame per scroll or layout change. There is no continuous animation loop. Media, scroll, resize, visibility, mutation and resize-observer subscriptions are cleaned up. Visibility changes do not change document layout.

The renderer, camera, scene, scroll hook, motion preferences and contact destinations are unchanged.

## Files

- `src/App.jsx` — separate visual hero and business-introduction sections, one copy of each element.
- `src/styles.css` — desktop composition and mobile layout/icon styling.
- `src/components/ContactActions.jsx` — accessible compact WhatsApp icon and scroll/collision handling.
- `tests/seo-browser.html` — update the old first-screen CTA assertion to reflect the requested new mobile position.
- `tests/mobile-layout.html` — actual production-browser layout, scroll, collision, resize and desktop-baseline checks.
- `docs/MOBILE-LAYOUT.md` — this implementation and application guide.

## Verification

- `npm test`: all 35 tests passed.
- Production build, prerender and `scripts/verify-build.mjs`: passed for all nine public pages and the 404 document.
- Mobile-specific production-browser fixture: 82 assertions passed at 320×780, 375×844, 390×844, 430×844, plus desktop comparisons at 1024×900, 1348×900 and 1920×900.
- Existing service-page production-browser fixture: 202 assertions passed, including forms, contact destinations, returned HTML, sitemap, robots and preview HTTP behavior.
- Desktop baseline differences: no measured differences above 1px at all three tested desktop widths.
- Initial JavaScript: Home 84.5 KiB gzip; service pages 83.8 KiB gzip, both within the existing 125 KiB limit.
- No external contact link was opened and no message was sent.

The desktop baseline measures Home bounds, name, kicker, role, heading, description, buttons, work link, caption and footer. The fixture compares the same elements against the pre-change build within a 1px tolerance.

Browser tests use Chromium iframe viewports. They are not physical Android/iOS device tests. Successful WebGL drawing cannot be verified in this cloud browser because its GL renderer is disabled; the fallback illustration allows layout inspection. Real Android Chrome, iPhone Safari and GPU rendering still require owner verification.

## Apply the update

The source was inspected directly from current GitHub and matched the local baseline. This prepared patch is not live: the connected GitHub integration cannot push changes.

1. Extract `Favas-Mobile-Hero-Layout-Fix.zip`.
2. Copy `mobile-hero-layout.patch` into your existing project beside `package.json`.
3. In Git Bash, run one command at a time:

```bash
cd "/c/portfolio 3d/portfolio"
git apply --check mobile-hero-layout.patch
git apply mobile-hero-layout.patch
npm run verify
```

Stop if the patch check fails and share the output. Do not force it over newer edits. The ZIP also includes the complete replacement version of every changed file, preserving its project path. It is a subset of the project, not a replacement for the whole `src` folder.

After reviewing `git diff`, stage only the update files:

```bash
git add src/App.jsx src/styles.css src/components/ContactActions.jsx tests/seo-browser.html tests/mobile-layout.html docs/MOBILE-LAYOUT.md
git --no-pager diff --cached --stat
git commit -m "Restore clear mobile hero and compact WhatsApp contact"
git push origin main
```

Render can auto-deploy the push. Otherwise open the existing **portfolio-1 Static Site → Manual Deploy → Deploy latest commit**. Keep the existing `dist` publish directory, production build command and domain settings. This layout update does not require DNS changes.

After Live, refresh on your phone and check the full hero, the introduction below it, View My Work, orientation changes, returning to the top, and WhatsApp accessibility without opening/sending an enquiry unintentionally.
