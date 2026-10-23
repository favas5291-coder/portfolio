# Portfolio evidence and validation

Reviewed on **22 October 2026**.

## GymDrobe source evidence

Repository: https://github.com/favas5291-coder/gym-store

Reviewed commit: `74bb08e8b32957581aeef46ad400cd0b01c73858`.

| Portfolio claim | Evidence and scope |
| --- | --- |
| React storefront | `package.json`, `src/pages/ProductPage.jsx` and React contexts |
| Product colour images | `ProductPage.jsx` selects `productImageSources(product, selectedColor)` and resets the selected gallery photo when the colour changes |
| Cart and wishlist | `src/context/StoreContext.jsx` handles account-scoped cart, wishlist and Buy Now state, stock validation and browser-storage fallbacks |
| Authentication interface | `src/context/AuthContext.jsx` restores sessions, integrates Google login, migrates guest shopping state and handles account changes |
| Checkout and Razorpay client integration | `src/services/paymentApi.js` supports `razorpay` and `cod-partial`, creates orders, sends payment verification requests, shares duplicate in-flight requests and handles uncertain network outcomes |
| Order and admin interfaces | Repository contains order/admin page files and `src/services/adminOrderApi.js`, including token-authenticated requests and error handling |
| MERN backend | Node, Express and MongoDB are supplied by the user as the project stack. The complete commerce backend was not present in the inspected public repository. No claim of an end-to-end backend audit is made. |

The live public storefront at https://www.gymdrobe.com/ was inspected for its actual presentation and screenshot. It displayed the product catalog, variants/stock messaging, shopping links and Razorpay/COD information. No account was created, customer order was submitted, payment was made, or privileged admin workflow was exercised.

The case study distinguishes verified frontend code from supplied backend information. It makes no claims about users, revenue, employers, testimonials, business performance or additional projects. Lessons are presented as implementation takeaways inferred from the inspected code, not invented personal anecdotes.

## The Forge implementation checks

Redesign reviewed on **23 October 2026 (India)**.

- React/Vite production bundle and build-time HTML prerender succeed. The exact production bundle was opened in the browser; no application or hydration errors appeared. A browser-extension metadata error was unrelated to the portfolio.
- Desktop composition checked at 1348px. The initial wide display-type overflow was corrected.
- Responsive content checked in 390px, 320px and 768px iframe viewports. Document widths matched available viewport widths (375px, 305px and 753px respectively, excluding the scrollbar).
- Navigation selects the correct anchor and chapter; header offsets were corrected.
- Skill selection changes the corresponding application detail and code/project link.
- A case-study disclosure opened using Enter on its native summary control.
- The real GymDrobe image opens in a native dialog and closes with Escape.
- The mailto destination matches the supplied email. Clipboard permission failed in the cloud browser; the accurate fallback message was confirmed. No email was sent.
- The automatic no-WebGL path renders the complete portfolio. A manual renderer attempt also reached the error boundary and retained all content. Subsequent capability checks avoid offering an unavailable renderer.
- The source includes reduced-motion detection, low-power/Save-Data selection, scene timeout, visibility pausing, demand rendering, desktop-only bloom and DPR cap.

## Verification limits

The cloud browser reports WebGL as disabled (`GL_RENDERER = Disabled`). It cannot render the 3D scene. The 3D implementation compiled successfully, but its final PBR appearance, camera framing, hover physics, device transformation and GPU frame rate could not be visually verified in this environment. Reduced-motion CSS/JS and hidden-tab control were reviewed in source; system settings were not emulated.

The 60fps and Lighthouse 85+ goals are **unmeasured targets**, not achieved scores. No Lighthouse result or physical mid-range-phone test is claimed. The tested layouts are iframe viewports rather than actual mobile hardware.

This is focused functional/responsive validation, not an accessibility certification, a live email-delivery test or an end-to-end audit of GymDrobe.
