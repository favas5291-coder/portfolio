# Freelance website SEO & enquiry implementation
Date: 23 October 2026. Owner: Muhammed Favas K. Production target: https://fazhere.com.

## Result and deployment status

Implemented in the existing React/Vite project, with nine prerendered pages, a clearer freelance message, direct contact actions, a validated enquiry flow, structured data and optional measurement. The 3D portfolio stays on Home; service and contact pages do not initialize a renderer. The existing automatic 3D, adaptive quality and reduced-motion implementation is retained.

This is a prepared code update, not a confirmed production deployment. GitHub files were read through the connected integration and compared by Git blob hashes with the local checkout. Every existing project file matched the current remote snapshot, including the already-added WhatsApp link; the downloaded old patch file in the remote tree is unrelated. Remote tree at inspection: `9c62853d65106455f39a6b6ca98e1c2ecb8a7c83`. The available GitHub integration cannot push. Apply the patch and follow **SEO-DEPLOY.md**.

## What the inspection found

- React 19 + Vite 6, Three.js / React Three Fiber, GSAP and Lenis; no routing library or enquiry backend.
- Render Static Site is the deployment target. Netlify and Vercel files were also present; they remain usable as static-host configurations.
- The original build already prerendered Home, so the original portfolio was not an empty client-only shell.
- Only Home appeared in the sitemap. Titles and descriptions targeted a developer portfolio, rather than distinct client services.
- The mobile hero reserved a large area before its main copy and actions. That made it harder to understand the service and contact the developer in the first screen.
- Contact had email/GitHub/WhatsApp, but no project brief form, click-to-call flow, dedicated services or project page URLs.
- Existing code contained real project copy, an actual GymDrobe screenshot and references to inspected source. Those were reused with their original review-date limits.
- Public web retrieval could not fetch fazhere.com, robots.txt or sitemap.xml in this session. This is a retrieval limitation, not evidence of a production outage or a Google indexing block. No live crawl, Search Console account or WordPress historical-URL export was available.

## Implemented changes

- Kept the charcoal, orange, Syne and monospace identity, name treatment and main animated sculpture.
- Added a clear business-focused Home H1 and immediately usable Discuss Your Website, WhatsApp Me and View My Work actions. Mobile contact actions precede the old animation gap.
- Added a Services overview and four substantial service pages with audience, problem, deliverables, evidence, process, FAQs and quote actions.
- Added the GymDrobe case study as an **own project**, not a paid client engagement. No revenue, client logos, ratings or performance outcomes were invented.
- Added Contact and Privacy pages, click-to-call/email, prefilled WhatsApp links, mobile contact dock and labels/error focus for the form.
- Form defaults to a truthful WhatsApp review-and-send handoff. Optional Formspree delivery uses a public form ID, provider confirmation, duplicate-click guard, timeout, cleanup, honeypot and error states. No live message was sent during QA.
- Added Person, WebSite, WebPage/ContactPage/CollectionPage, Service and BreadcrumbList JSON-LD with connected identifiers. No unverified address, hours, price or review schema.
- Prerendered all nine pages with unique metadata, HTTPS apex canonicals, social metadata and the existing share image/favicon. Kept local fonts and responsive screenshot dimensions.
- Split Home and marketing-page modules. 3D, optional effects and GSAP remain separate downloads; the service page content and form do not depend on them.
- Generated sitemap/robots for the selected build environment, production/preview index directives and a 404 document. Added a static-host reference configuration and read-only post-deploy HTTP checker.
- Prepared optional GA4 with visitor opt-in, named contact-click and confirmed-submission events. Queries, fragments, form values and WhatsApp URLs are not supplied as event parameters. Provider-side Enhanced Measurement must also be disabled.
- Preserved existing chapter fragments. No invented WordPress redirects or duplicate Calicut location pages.

## Keyword-to-page map

This is a qualitative intent map, not a paid keyword-tool report. A public search snapshot for freelance web development in Kozhikode/Calicut surfaced local developer/service pages, quote/contact paths and business/e-commerce intent. These observations inform the grouping below. No search volumes, keyword difficulty, rankings or traffic estimates were obtained or invented. The exact phrases remain hypotheses to refine with actual Search Console queries.

| Canonical path | Primary intent | Supporting phrases used naturally |
| --- | --- | --- |
| / | Find a local freelance developer | freelance web developer in Kozhikode; freelance web developer in Calicut; MERN stack freelance developer; React website developer |
| /services/ | Compare what Favas can build | website developer in Kerala; freelance website development services; hire a freelance web developer |
| /services/business-websites/ | Commission a business information website | business website development; small business website designer; business website developer in Kozhikode |
| /services/ecommerce-development/ | Commission a custom store | e-commerce website developer; e-commerce development in Kerala; custom React store |
| /services/landing-pages/ | Build one focused offer/campaign page | landing page developer; landing page for business enquiries |
| /services/website-redesign/ | Improve an existing website | website redesign services; React website improvements; website redesign in Kozhikode |
| /projects/gymdrobe/ | Assess real development evidence | GymDrobe case study; MERN e-commerce project; React checkout project |
| /contact/ | Make a project enquiry | contact Favas; request a website quote; hire Favas |
| /privacy/ | Understand data use | navigational/supporting page, not a separate commercial keyword target |

Kozhikode and Calicut name the same place. Kerala and remote India are service-availability descriptions, not claims of additional offices. Home owns broad local-developer intent; service pages own distinct tasks. Do not add thin city clones.

## Final page titles and descriptions

The following table is generated from the same data used by the build.

| Path | Title | Description |
| --- | --- | --- |
| / | Freelance Web Developer in Kozhikode \| Muhammed Favas K | I’m Favas, a freelance web developer in Kozhikode (Calicut), Kerala. Business websites, online stores and landing pages. Available for remote projects across India. |
| /services/ | Freelance Website Development Services \| Favas, Kerala | Explore business websites, custom e-commerce development, landing pages and website redesign with Favas in Kozhikode, Kerala. Find the right scope and request a quote. |
| /services/business-websites/ | Business Website Development in Kozhikode \| Favas | Business website development for small businesses in Kozhikode and Kerala. Clear service pages, mobile layouts and easy customer contact. Request a quote. |
| /services/ecommerce-development/ | E-commerce Website Developer in Kerala \| Favas | Custom e-commerce website development with React and the MERN stack. Product variants, cart, checkout and order flows. Explore GymDrobe and request a quote. |
| /services/landing-pages/ | Landing Page Developer for Business Enquiries \| Favas | Focused, responsive landing pages for a business, service or campaign. Clear copy, useful proof and WhatsApp or enquiry actions. Request a project quote. |
| /services/website-redesign/ | Website Redesign Services in Kozhikode \| Favas | Website redesign and React website improvements for businesses in Kozhikode and Kerala. Review mobile layouts, service clarity, speed and contact journeys. |
| /projects/gymdrobe/ | GymDrobe Case Study — MERN E-commerce Project \| Favas | Explore GymDrobe, Muhammed Favas K’s own fitness e-commerce project: the business problem, React storefront, purchase flow and full stack development contribution. |
| /contact/ | Discuss Your Website — Contact Favas in Kozhikode | Need a business website, online store or landing page? Contact freelance web developer Muhammed Favas K in Kozhikode by WhatsApp, phone, email or project enquiry. |
| /privacy/ | Privacy & Enquiry Information \| Favas | How project enquiries and optional analytics are handled on fazhere.com. Contact Favas about your information or update your analytics preference. |

The 404 page is noindex and absent from the sitemap. Preview pages are also noindex, with no indexable sitemap entries; crawling stays allowed so crawlers can read that directive. Production canonicals are stable across tracking queries and trailing-slash duplicates.

## Verification and measured limits

| Check | Result |
| --- | --- |
| Existing + new Node tests | 35 passed, 0 failed |
| Production build and prerender | Passed: 9 public HTML pages + 404 document |
| Preview build | Passed with noindex on all pages and zero indexable sitemap URLs; production build restored afterward |
| Static build verifier | Passed: one H1, distinct titles/descriptions, canonical URL, structured data JSON and references, every internal link/fragment, static assets, contact destinations, sitemap and robots |
| Production browser fixture | 202 passed assertions across 320×780, 390×844, 820×1180 and 1348×900 Chromium iframe viewports |
| Existing 3D browser fixture | 30 passed assertions for automatic attempts, scroll, viewport swaps, system/user motion choices and saved 2D behavior; successful GPU rendering unverified |
| Core text/button contrast | Calculated solid-color ratios: body 15.50:1, muted text 8.07:1, accent 6.38:1, button text 6.09:1. This is not a complete visual contrast audit of the animated scene |
| Form browser behavior | Empty-field errors, first-error focus, phone-only validation and WhatsApp brief handoff passed; no message sent |
| Preview HTTP | 200 marketing pages, returned HTML canonicals, genuine 404 for unknown route and missing asset, clean route access, tracking canonical, sitemap and robots passed |
| Initial JavaScript including selected page/shared imports | Home **83.5 KiB gzip**; marketing pages **82.9 KiB gzip**; both below the existing 125 KiB budget |
| CSS output | Approximately 43.4 kB uncompressed / 10.3 kB gzip |
| Heavy scene | About 278.9 kB gzip, deferred from initial interaction code; not loaded on service pages |
| Lighthouse | Not run; no Lighthouse automation was available through the supported browser interface |
| Field Core Web Vitals | No real-user dataset or verified account access available; no LCP/INP/CLS field result claimed |
| External schema validator | Not run; JSON syntax/entity consistency checked locally, not a guarantee of search rich results |
| Android Chrome, iPhone/iPad Safari, real desktop GPU | Not physically tested |
| Successful 3D rendering | Not verified: cloud Chromium reports GL_VENDOR/GL_RENDERER Disabled and cannot create a WebGL context |
| Live fazhere.com HTTP/redirects after this change | Pending deployment; the supplied checker verifies these on the real host |
| External contact apps / provider inbox | WhatsApp URL generation and form logic checked; app handoff, live provider acceptance and inbox delivery need owner tests |

Browser viewports are layout simulations, not Android/iOS emulators. Renderer failure is handled without hiding the service copy; real-device rotation, address-bar behavior, touch gestures, background/resume and successful GPU recovery remain part of owner acceptance testing. The previous 3D behavior tests still check defaults, saved preferences, adaptive quality, scroll sampling, framing and lifecycle behavior.

A build warning remains for the large deferred 3D chunk. The app is not downloading that scene for a service/contact visit. Do not turn 3D off based on phone hardware to hide the warning. These transfer sizes are not a Lighthouse score, an FPS measurement or proof of passing Core Web Vitals.

## Correct status codes and redirect boundaries

The preview is configured as a static host, not an SPA that returns Home with status 200 for every URL. Actual Render behavior depends on removing any old catch-all rewrite. `render.yaml` is a reference; an existing Dashboard-managed service does not automatically adopt it.

Canonical routes use directory-style trailing slashes and real HTML output. Slashless variants can return the same page with the correct canonical, or redirect to it. Query variants share the same canonical. HTTP→HTTPS and www→apex need live checks; no production redirect was changed or confirmed through an authenticated Render account here.

The provided 404 document is available for hosts that honor it; Render can use its own 404 body. A genuine missing-page status matters more than showing the custom design with a misleading 200 status. Existing WordPress URLs should be mapped only after obtaining the real old sitemap/Search Console URLs.

## Search Console and Bing owner setup

1. After deployment, run the live checker and inspect the homepage/services HTML with View Source.
2. In Google Search Console, add the **fazhere.com Domain property** and follow the DNS TXT instructions at your current DNS provider. Keep existing A/CNAME/email records intact. This verifies the domain; it is not a ranking submission.
3. Alternatively use an HTTPS URL-prefix property and its HTML-tag verification token. Set only the token value as `GOOGLE_SITE_VERIFICATION` in Render, rebuild, then verify in your own account. The code emits the tag; it does not complete ownership verification.
4. Submit `https://fazhere.com/sitemap.xml` in Sitemaps. Inspect Home and the service URLs with URL Inspection; request indexing for important pages after the live test succeeds. Monitor indexing reports for exclusions and wrong canonicals.
5. In Bing Webmaster Tools, import the verified Search Console property where available, or add the site and use its verification instructions. An HTML-tag token can be supplied as `BING_SITE_VERIFICATION`; rebuild before verification.
6. Submit the same canonical sitemap in Bing and check its indexing/crawl reports.

Nothing was verified or submitted on your behalf. Discovery and indexing can take time and are not guaranteed by a sitemap or a request.

## Local discovery eligibility

**Do not create a Google Business Profile until the business's real operating model is confirmed.** Google excludes online-only businesses from Business Profile eligibility. Remote web-development availability alone does not establish eligibility.

If you genuinely meet clients in person at an eligible business location or visit customers in person, first confirm the applicable Google rules. Then the conditional checklist is:

- Use the real public-facing business name, without keywords added to the name.
- Choose the accurate service category and a truthful service area.
- Provide the verified phone and website.
- Use a real eligible address only where required; hide a home address for a legitimate service-area business where Google's rules permit it.
- Enter only real hours and authentic business photos, then complete the verification method Google provides.
- Request reviews only from genuine eligible customers; never buy or fabricate them.

No LocalBusiness markup, street address, business hours or review claims were added. If the business is online-only, focus on the website, Search Console, existing professional profiles and legitimate online discovery instead.

## Measurement and owner decisions

The optional analytics integration needs your GA4 ID, provider settings and review of the Privacy copy. Enhanced Measurement/user-provided data must be disabled before enabling this integration. Analytics are opt-in, and may undercount visitors who decline.

Track these as separate stages:

| Stage | What it proves |
| --- | --- |
| Page view | A measured visit, subject to consent and blockers |
| WhatsApp/call/email click | Intent to open a contact channel; not a message or conversation |
| enquiry_submitted | A positive form-provider acknowledgement; not inbox delivery, qualification or a sale |
| Qualified enquiry | You confirm a relevant need, plausible scope and contact with the prospect |
| Client/project agreed | A real agreement recorded in your own business process |

Keep enquiry content and personal details out of analytics. If you keep a business log, record only the information you actually need, protect access and agree a retention practice.

Still requiring owner input: Formspree recipient/form ID for direct submission; GA4 and webmaster account identifiers/verification; actual Google Business Profile eligibility; quote/support/maintenance terms; WordPress/Shopify capabilities before advertising them; any paid-search budget; any historical URLs that need redirects. Prices, free-consultation offers, turnaround promises and guaranteed response times were not invented.

## Prioritized 30-day client acquisition plan

| Days | Priority and action | Useful outcome / check |
| --- | --- | --- |
| 1–3 | Apply, verify and deploy. Remove the SPA catch-all. Check every contact channel on your own phone. Confirm preview noindex is not used in production. | Working service URLs and a truthful enquiry path |
| 3–5 | Verify Search Console/Bing and submit the sitemap. Review indexing, detected canonical and crawl errors; fix technical failures first. | Baseline impressions/clicks when data becomes available; no ranking promise |
| 5–7 | Review your real scope, quote process and availability. Update existing LinkedIn/GitHub profile links to the relevant service/case-study pages yourself. | Consistent identity and clearer relevance |
| 8–10 | Prepare one useful article: “What to prepare before asking for a business website quote.” Use actual questions, a practical content checklist and a service link. Review before publishing. | A useful resource that supports business-website intent |
| 11–14 | Prepare a second article: “Business website or online store: what does your customer need to do?” Explain tradeoffs and show relevant real project screens. | Better-qualified enquiries; no mass-produced city articles |
| 15–18 | Improve the GymDrobe case study with updated real screenshots and specific build decisions. Keep its own-project label and distinguish implemented features from end-to-end verified behavior. | Stronger evidence without invented success metrics |
| 19–21 | Prepare two LinkedIn posts: one real build decision and one practical website checklist, each linking to a relevant page. Obtain permission before using client material or testimonials. | Useful professional proof; publishing remains your decision |
| 22–24 | Identify relevant local designers, photographers and business-support professionals for possible referral partnerships. Prepare a collaboration offer; use opt-in or existing relationships and approve each outreach separately. | Legitimate referral opportunities; no unsolicited message campaign |
| 25–27 | Review actual Search Console queries and enquiries. Clarify pages where visitors misunderstand the service; add useful answers based on real questions. Check form-provider failures/spam and contact handoffs. | Evidence-led improvements instead of keyword repetition |
| 28–30 | Review qualified enquiries and agreed projects separately from clicks. Optionally define a small paid-search experiment only after you choose a separate budget and approve spending; use a focused service page and real enquiry follow-up. | A measured next-month decision, with a stop/continue rule based on qualified enquiries |

Do not buy backlinks or reviews, publish fabricated testimonials, mass-generate thin articles or send unsolicited outreach. No posts, accounts, listings, messages or advertising spend were created by this work. Rankings, AI recommendations, traffic and client counts are not guaranteed.

## Sources consulted

- [Google: JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Google: canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Google: build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Google: verify site ownership](https://support.google.com/webmasters/answer/9008080)
- [Google: Business Profile eligibility](https://support.google.com/business/answer/7039811?hl=en)
- [Bing: add and verify a site](https://www.bing.com/webmasters/help/add-and-verify-site-12184f8b)
- [Render: static sites](https://render.com/docs/static-sites)
- [Render: redirect/rewrite rules](https://render.com/docs/redirects-rewrites)
- [Google Analytics configuration](https://developers.google.com/analytics/devguides/collection/ga4/reference/config)
- [Formspree: JavaScript submissions](https://help.formspree.io/articles/building-your-form/submit-forms-with-javascript-ajax/)

## Changed files

- `.env.example`
- `README.md`
- `docs/SEO-DEPLOY.md`
- `docs/SEO-REPORT.md`
- `index.html`
- `netlify.toml`
- `public/sitemap.xml`
- `render.yaml`
- `scripts/check-deployment.mjs`
- `scripts/prerender.mjs`
- `scripts/seo.mjs`
- `scripts/set-site-url.mjs`
- `scripts/verify-build.mjs`
- `src/App.jsx`
- `src/MarketingPages.jsx`
- `src/components/AnalyticsPreference.jsx`
- `src/components/ContactActions.jsx`
- `src/components/EnquiryForm.jsx`
- `src/components/ServiceLinks.jsx`
- `src/data/portfolio.js`
- `src/data/site.js`
- `src/enquiries/form.js`
- `src/entry-server.jsx`
- `src/main.jsx`
- `src/seo/analytics.js`
- `src/seo/pages.js`
- `src/styles.css`
- `tests/browser.html`
- `tests/seo-browser.html`
- `tests/seo.test.mjs`
- `vercel.json`
- `vite.config.js`
