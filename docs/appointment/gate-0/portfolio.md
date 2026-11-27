# Portfolio and shopper evidence

Gate 0, 27 November 2026. Source baselines are portfolio main at b0de656a2f717dc69b14aee9c716bca9c3a60329 and the reviewed Appointment head at 340bb56. Shopper observations are from the public GymDrobe product page in a new Linux Chromium 156.0.8078.79 session at 390 × 844 CSS pixels, DPR 1, with mouse input. The reopen used a second clean browser context.

## What a shopper can demonstrate today

The COITONIC Compression Half Sleeves T-shirt opened with BLACK selected. Clicking RED selected the red swatch, changed the large decoded photograph to the red front view and changed the page address to end in `?colour=RED`. Opening that address in a clean browser context restored RED and the same red photograph. This gives a customer a link they can open later to see the colour they chose. In this browser, the store's own “Share product” button copied the base address without the colour. Use **Open red at GymDrobe** on the local excerpt. Stock and size changes were outside this observation. [Product](https://www.gymdrobe.com/product/6ad2351ed8f991271e3d1a8b) · [Reopen red](https://www.gymdrobe.com/product/6ad2351ed8f991271e3d1a8b?colour=RED)

| Live evidence | Result |
| --- | --- |
| [Opening photo](gymdrobe/before.jpg) | BLACK pressed, five thumbnails, black photo decoded |
| [After choosing red](gymdrobe/after.jpg) | RED pressed, five thumbnails, red photo decoded |
| [Reopened from address](gymdrobe/reopened.jpg) | Clean session, same red image URL, RED pressed |
| [Browser observations](gymdrobe/observations.json) | Exact URLs, image names and dimensions, Share button clipboard |

Independently inspected source at commit `6e93a5643feb745c673936cb16e5937b9f8761db`. In `src/pages/ProductPage.jsx` lines 159–244, the component accepts a known colour from the URL, chooses its photo sources, resets gallery selection on a swatch click and replaces the current URL query. Lines 389–407 build a bare product URL for the Share action. This commit identifies the inspected source. A live deployment SHA was unavailable. [Colour and photo handling](https://github.com/favas5291-coder/gym-store/blob/6e93a5643feb745c673936cb16e5937b9f8761db/src/pages/ProductPage.jsx#L159-L244) · [Share action](https://github.com/favas5291-coder/gym-store/blob/6e93a5643feb745c673936cb16e5937b9f8761db/src/pages/ProductPage.jsx#L389-L407)

## What to carry forward

| Surface | Current main and reviewed work |
| --- | --- |
| Homepage | Main is Variable Width, a four-stop visit at home, work, process and contact. The opening HTML gives the name, business offering, Explore my work, Talk to Favas and Kozhikode. The width-adjustable shirt exhibit follows the opening. PR 18 already has the requested identity and offer, case-study thumbnail, WhatsApp link, room anchors, keyboard escape handling and six-step native-scroll path. Reuse its accessible HTML and navigation. |
| Routes and identity | Main prerenders eleven public pages including the homepage, services index, four service details, three case studies, contact and privacy, plus a 404. Preserve the two separate demo paths, service query-prefills, existing hash aliases, metadata, structured data, canonical URLs and sitemap. The project uses a Fazhere studio wordmark. The reviewed index links the illustrated favicon family. Keep the review's icon choice and the existing favicon sizes. |
| Projects | Main’s exhibit registry imports project identities from portfolio data and joins them to the preview manifest. GymDrobe is the founder's store. Everyday Luxvibe and FABEA are independent concepts with illustrative inventory. Keep disclosures for generated/sample imagery and the simulated Luxvibe owner tools. |
| Enquiries | `src/data/site.js` sets WhatsApp 918156805806 and `tel:+918156805806`. Profile email is favas5291@gmail.com. The enquiry form conditionally uses the configured Formspree ID or prepares a WhatsApp handoff. PR 18 adds session draft merge/restore for name, email, phone, business, service, budget and message, including browser pageshow. Reuse this and the last-project/return-focus handling. |
| Services | The four configured options are business websites, e-commerce development, landing pages and website redesign. PR 18 maps each to a specific example and uses the configured deliverable. E-commerce links to GymDrobe and promises “A responsive storefront and product detail pages.” |
| Process | Render the configured stages in `src/data/site.js` from discussing requirements to agreeing scope and quote, design and development, review, launch and handover. |
| Tests | Reuse the package verify command, preview validation and browser review workflow. PR 18's browser checks cover restoration and interaction. Re-run on the eventual candidate. |

[Main README](https://github.com/favas5291-coder/portfolio/blob/b0de656a2f717dc69b14aee9c716bca9c3a60329/README.md) · [Data and destinations](https://github.com/favas5291-coder/portfolio/tree/b0de656a2f717dc69b14aee9c716bca9c3a60329/src/data) · [Routes](https://github.com/favas5291-coder/portfolio/blob/b0de656a2f717dc69b14aee9c716bca9c3a60329/src/seo/pages.js) · [Prior review](https://github.com/favas5291-coder/portfolio/pull/18)

## Project previews

| Project | Desktop asset and capture date | Portrait pairing |
| --- | --- | --- |
| GymDrobe | gymdrobe-a07969f42e0c62ed.webp · 26 Nov 2026 | Stale. The 3 Nov portrait names the earlier desktop ed3aa74b2c75d090. Use the current 1348 × 926 desktop capture contained inside a frame, including on phones. |
| Luxvibe | luxvibe-2ae9d601a7f19661.webp · 4 Nov 2026 | 390 × 844 portrait matches desktop. |
| FABEA | fabea-40138d458cd668dd.webp · 6 Nov 2026 | 390 × 844 portrait matches desktop. |

Use blank monitor plates for stills or footage, then composite the current manifest capture into each screen. Handle its original aspect ratio and valid mobile pairing in one shared selector. The local product excerpt has separate shirt photographs. The live originals observed here load from coitonic.com. Keep the evidence captures within this review and confirm the portfolio’s existing permission for the supplier photography before distributing newly packaged crops or texture files. Retain the README preview refresh command and content-hashed asset flow. A replacement GymDrobe portrait can be captured from the live site and paired when the current design is separately verified. [Manifest](https://github.com/favas5291-coder/portfolio/blob/b0de656a2f717dc69b14aee9c716bca9c3a60329/src/data/project-previews.js)
