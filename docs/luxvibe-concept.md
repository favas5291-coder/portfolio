# Luxvibe independent concept

The portfolio includes a second selected-work entry and a prerendered case study at `/projects/luxvibe/`. The complete, portable storefront is served at `/demos/luxvibe/`; it uses the existing fazhere.com deployment and needs no new DNS record or domain purchase.

This is self-initiated design and frontend work, not a commissioned or approved client engagement. Products, prices, inventory and AI-generated photographs are samples. Enquiry previews send no messages and create no orders. Owner controls are an explicitly browser-local simulation, with no real customer information or passwords required.

## What is included

- Responsive catalog, search and compound filters.
- Stock-aware variants, quantity controls, wishlist and a persistent bag.
- Itemized sample enquiry messages whose product links retain the nested demo address.
- Local owner-demo product and content controls.
- Real desktop/phone browser captures, registered in `src/data/project-previews.js` with their dates and dimensions.
- A project case study covering design decisions, scope and verification, with a link to discuss a similar store.

## Validation

`npm run verify` passes 66 tests, builds the application and checks all 10 prerendered pages, internal links, metadata and sitemap entries. Eleven of those tests cover the packaged demo's commerce logic; three cover nested routing, MIME types, path containment, redirects and rejected mutations. Browser review covered the combined ₹3,770 example, responsive widths and the case study, with no physical-device or Lighthouse result claimed.

The raw screenshot captures were made from the running site in Chrome; they are not generated UI images. Only the illustrative product photography was AI-generated.

## Maintenance

The static concept files are in `public/demos/luxvibe/`. Keep relative resource links and module-based asset resolution so it continues to work under that path. Update the copied commerce tests if the shared logic changes. `scripts/serve-demo.mjs` serves the isolated static app during Vite development and production preview. Netlify and Vercel serve its packaged index directly.

A standalone copy is also retained in the original concept Site. Future storefront changes should be synchronized deliberately between that source and the portable copy. Changing a screenshot does not change the case study's source-review claims. The demo is excluded from indexing; the independent portfolio case study remains indexable.

An actual client launch still needs approved inventory and policies, a verified receiving number, and an agreed production architecture with authenticated management and shared storage. No paid service or new domain was purchased.
