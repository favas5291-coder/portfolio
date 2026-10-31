# FAZHERE — Client-confidence iteration

## User goal

The visitor should quickly see design craftsmanship, evidence of real full-stack work, clear service offerings, and a safe way to begin a paid project enquiry. The existing five-stage 3D artwork remains intact; animation is the invitation, verifiable work is the reason to hire.

Reference: Flux Theory's themed storytelling (https://www.fluxtheory.in/) informed the ambition for distinctive presentation. No imagery, source, slogans, layouts or motion assets were copied. Its full browser choreography was not independently reproduced.

## Changes

- **Hero:** a concise "Design that moves. Code that works." proposition, two direct routes to real work and starting a project, optional narrated tour (never autoplay), and an authentic GymDrobe preview in a clear editorial display. Visitors no longer need to complete the narrated tour to inspect real proof.
- **Why trust this work:** a three-part evidence strip that links design and application engineering to observable, inspectable evidence. No fictitious customers, results, years of experience, awards or testimonials.
- **Engineering lab:** interactive source-reviewed decisions loaded only from `project.decisions`, including their challenge, implemented approach, takeaway and a GitHub source link at `project.commit`. It is clearly distinguished from untested end-to-end business outcomes.
- **Inquiry builder:** visitor chooses one of the four actual site services, goal, and starting stage; optionally enters the project and requirements. It constructs a WhatsApp or email draft locally. No data is sent or saved automatically, and no quote/pricing is invented.
- **Navigation and contact:** names that a potential buyer understands, high-priority Start a Project link, accessible tour, direct service links, and retained phone, WhatsApp and email.
- **Mobile/responsive:** proof card becomes part of the normal document flow and the evidence, engineering and enquiry layouts adapt for narrow viewports; reduced-motion CSS respects the user setting.

## Source-of-truth and privacy

- Real project details `src/data/portfolio.js`
- Service names and WhatsApp number `src/data/site.js`
- New components `src/components/ClientConfidence.jsx`
- New styles `src/components/ClientConfidence.css`
- Existing source-driven screenshot update flow `src/data/project-previews.js` is unchanged.

Inputs in ClientBrief live only in component state until user elects to open WhatsApp or their mail client. The browser may transmit the generated draft to those external services if the visitor continues. No backend or analytics event is added.

## Release verification

Run `npm ci && npm run verify`. The existing Playwright workflow additionally tests the main hero proof screenshot, engineering button selection, source details, generated enquiry link, WebGL canvas, viewport overflow and page errors at desktop, tablet and mobile widths.

Before a production merge, review actual desktop/mobile screenshots and check text wrapping, project preview accuracy, contact application behavior, WebGL on mobile, and keyboard navigation. Performance and SEO claims require measured results. A realistic animated likeness and true lip synchronization remain unimplemented.

No merge or deployment is made by this PR. PR #4, an unrelated pending mobile heading-contrast improvement, is left untouched.
