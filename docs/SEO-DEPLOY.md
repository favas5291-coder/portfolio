# Deploy the freelance services update

This is an update to the existing React/Vite portfolio and the existing Render **portfolio-1 Static Site**. Keep your current domain and DNS. The GitHub connection available to this assistant cannot push, so the prepared changes are not live until you apply and push them.

## 1. Apply the update locally

Extract `Favas-Freelance-SEO-Update.zip`. Copy `freelance-seo.patch` beside your project's `package.json`. The patch is based on the current GitHub files, including the automatic mobile 3D fix and WhatsApp contact link. It does not need those previous patches to be applied again.

Open Git Bash and run one command at a time:

```bash
cd "/c/portfolio 3d/portfolio"
git status --short
git apply --check freelance-seo.patch
git apply freelance-seo.patch
npm ci --include=dev
node scripts/set-site-url.mjs https://fazhere.com
npm run verify
```

If the patch check fails, stop and share the output. Do not force-apply or overwrite newer edits. `replacement-files/` contains the complete final version of each changed file for review or manual application; it is not a complete project or a new `src` directory to replace wholesale.

Use `git diff` to review the changes. The patch preserves your existing sculpture, scene code, camera timeline, adaptive rendering, reduced-motion controls and chapter URLs.

## 2. Commit and push

After verification passes:

```bash
git add .env.example index.html render.yaml netlify.toml vercel.json vite.config.js src scripts tests docs README.md public/sitemap.xml
git diff --cached --stat
git commit -m "Add freelance service pages and enquiry SEO"
git push origin main
```

Do not add your `.env`, `dist`, `node_modules` or downloaded patch/ZIP files. Check the staged list before committing. If your local branch is not `main`, resolve the branch selection before pushing.

## 3. Update the existing Render service

1. Open Render and select **portfolio-1**, the **Static Site** connected to this portfolio repository.
2. Branch: `main`. Root Directory: leave blank. Publish Directory: `dist`.
3. Set the Build Command to:

```bash
npm ci --include=dev && node scripts/set-site-url.mjs https://fazhere.com && npm run verify
```

4. Environment: `NODE_VERSION=22.22.0`, `SITE_ENV=production`.
5. In **Redirects/Rewrites**, remove an existing **Rewrite** from `/*` to `/index.html` if present. Every page now has its own HTML file. Keep unrelated intentional redirects. Never add a blanket redirect of missing pages to Home.
6. In **Headers**, add `/assets/*` → `Cache-Control: public, max-age=31536000, immutable`; add `/*` → `Referrer-Policy: strict-origin-when-cross-origin` and `/*` → `X-Content-Type-Options: nosniff`.
7. Keep `fazhere.com` as the primary custom domain and its `www` redirect. Render handles HTTP-to-HTTPS. Verify these after deployment; no DNS reset is needed.
8. If auto-deploy has not started, choose **Manual Deploy → Deploy latest commit**. Wait for **Live**.

`render.yaml` records these settings, but merely committing it does not update an existing Dashboard-managed service. Do not create a second service or change the domain to use the file.

Canonical service URLs use trailing slashes, such as `/services/business-websites/`, matching their generated `index.html` directories. Both slashless and slashed variants must be reachable; canonical tags always use the slash version. Render may serve a resource directly rather than apply a redirect rule, so post-deploy tests accept a correct 200+canonical or a redirect. Query parameters do not change the canonical URL. Do not add a global slash rewrite that creates loops.

Old `/#home`, `/#about`, `/#skills`, `/#projects` and `/#contact` URLs still work. No old content has been moved away from those anchors. Do not invent WordPress redirect destinations: export real old URLs from Search Console or your old sitemap before mapping useful replacements.

## 4. Check the live deployment

Run this read-only check after the new build is Live:

```bash
node scripts/check-deployment.mjs https://fazhere.com
```

It checks all nine pages, initial HTML titles/canonicals, sitemap, robots, tracking-parameter canonicalization, missing-page HTTP 404, slashless page access, HTTP→HTTPS and www→apex. It does not send messages or prove inbox delivery.

Open Home, Services, a service page, GymDrobe and Contact yourself. Check a fresh phone visit, refresh, native scrolling, rotation and background/resume. Test the WhatsApp link by reviewing the prepared message in your own WhatsApp; opening a link is not a sent enquiry. Call/email links need a compatible device or application.

Render must return an actual 404 for a random missing path. A branded `404.html` is included for hosts that use it; Render may display its own 404 body. Do not rewrite unknown paths to that document with status 200. The preview's custom 404 body is not proof that Render will use the same body.

If the `onrender.com` hostname remains public, it serves the same build with production canonicals. You may disable that subdomain in Render **after** the custom domain works. Host-specific noindex cannot be enforced by this static build alone.

## 5. Optional direct form delivery

No email server or private form credentials exist in this Static Site. Without configuration, the form validates the brief and offers a WhatsApp review-and-send link; it never reports that the message was sent.

To enable direct form submissions:

1. In your own Formspree account, create a form with `favas5291@gmail.com` as recipient and complete their recipient verification.
2. Copy the public form ID from `https://formspree.io/f/YOUR_ID`.
3. In Render Environment add `VITE_FORMSPREE_FORM_ID=YOUR_ID` (ID only), then redeploy. A public form ID is not an API secret. Never put a Formspree API key, email password or other secret in `VITE_*`.
4. Configure allowed-domain restrictions for `fazhere.com` in the provider, and enable its available spam protections. The code includes a honeypot; the provider also applies rate limits and filtering. These are not a promise that all spam will be blocked.
5. Submit one consented test enquiry yourself. Confirm both the provider record and recipient inbox. Check invalid input, provider errors and rate-limit handling. No live submission was made by the assistant.
6. If your provider settings require an interactive CAPTCHA, do not advertise direct delivery until the matching widget flow is integrated and tested. This implementation does not solve CAPTCHA challenges.

The form requires name, service, description and at least email or phone. It guards duplicate clicks, aborts on unmount, times out unconfirmed requests, retains details on failure and only confirms a successful provider response. A provider acceptance is not proof of inbox delivery or a paying client.

## 6. Preview builds and measurement

For a separate preview or staging build, set `SITE_ENV=preview`. Render pull-request builds with `IS_PULL_REQUEST=true` also get `noindex`. Keep crawling allowed so the noindex directive can be seen. Preview sitemaps contain no indexable URLs. Do not set preview mode on the production service.

To use optional Google Analytics:

1. Create/select your own GA4 web stream.
2. **Disable Enhanced Measurement and user-provided data collection**, especially automatic outbound-link, form and site-search collection. Otherwise provider-side settings may capture URLs/fields outside this integration's allowlist.
3. Set `VITE_GA_MEASUREMENT_ID=G-YOURID` in Render and rebuild.
4. Check the Privacy copy against your actual business/provider settings before enabling.
5. Analytics remain off until the visitor chooses **Allow optional analytics** in the footer or Privacy page. Test opt-in, opt-out and refresh. Do not add another automatic analytics or tag-manager snippet.
6. In GA4 DebugView/Realtime, verify `whatsapp_click`, `call_click`, `email_click`, `enquiry_submitted` and page views. The code does not pass form contents, query strings, phone/email values or WhatsApp message text as event parameters. Form success is emitted only after provider confirmation; a WhatsApp handoff emits only a click.

No Search Console, Bing, analytics, Formspree or Google Business Profile account was created or verified by this update. See `SEO-REPORT.md` for setup, remaining decisions and the 30-day plan.

## Sources checked on 23 October 2026

- [Render Static Sites](https://render.com/docs/static-sites)
- [Render redirects and rewrites](https://render.com/docs/redirects-rewrites)
- [Render custom domains](https://render.com/docs/custom-domains)
- [Formspree JavaScript submissions](https://help.formspree.io/articles/building-your-form/submit-forms-with-javascript-ajax/)
- [Formspree honeypot](https://help.formspree.io/articles/building-your-form/honeypot-spam-filtering)
- [Formspree limits](https://help.formspree.io/articles/form-and-project-settings/system-limits)
- [Google Analytics configuration](https://developers.google.com/analytics/devguides/collection/ga4/reference/config)
