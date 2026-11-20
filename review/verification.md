# Variable Width verification

The production build at `335c284` passed 10 end-to-end checks in each of Chromium desktop, WebKit desktop, and WebKit phone emulation. The checks recorded zero uncaught page exceptions or missing local resources. Commit `51a8ecf` subsequently updated the still-authoring script only.

## Visitor experience

- The first HTML response contained Favas’s name, offer, opening image and contact links. The first 120 px of scrolling advanced the camera, and reverse scrolling returned it to the opening.
- GymDrobe’s red compression shirt remained selected as its two-column overview changed to a native-width, single-column product page. On the phone, the underlying container measured 610 CSS px wide and 304 px compact. Browser Back and Close both restored the product details, selected colour, width, case-link focus and exact 844 px scroll position.
- On the orange grip, a one-finger vertical gesture scrolled 117 px and kept the control at 50%. A horizontal drag changed it to 100% with zero vertical movement.
- The two review proposals showed the same product at the same scale. Switching from image to details exposed the difference between an inline shopping action and one pinned to the screen edge. Keyboard navigation and fresh Work, Process and Contact links passed.
- Reduced motion, blocked WebGL, and forced context loss each preserved four matched stills, the working exhibit and contact actions. The generic brief and all three service choices used the verified WhatsApp number **+91 81568 05806**. Browser requests were intercepted locally. The online-store draft read “Hi Favas, I’d like to discuss an online store for my business.” The secondary link used favas5291@gmail.com.

## Performance

Each row is one cold visit to the uncompressed local production build, DPR 1, with ordinary unthrottled HTTP and no recording. The interaction measurement used a separate cold visit to Work and ended when a real click opened the product details.

| Browser and viewport | First contentful paint | First live frame | Product interaction | Live scroll, median / p95 | After fallback, median / p95 |
|---|---:|---:|---:|---:|---:|
| Chromium 156 · 1440 × 900 | 1,648 ms | 2,600 ms | 2,997 ms | 250 / 1,100 ms | 17 / 67 ms |
| WebKit 26.5 · 1440 × 900 | 270 ms | 3,068 ms | 612 ms | 274 / 337 ms | 17 / 47 ms |
| WebKit 26.5 · 390 × 844 | 184 ms | 1,419 ms | 602 ms | 42 / 70 ms | Stayed live |

Software rendering visibly stuttered. Desktop Chromium and WebKit reduced their drawing buffers and switched to stills at 4.93 s and 3.89 s respectively. Their live samples contained eight and four animation-frame intervals before fallback. The phone reduced its buffer to 288 × 624 and remained live. Of 147 phone intervals, 38 exceeded 50 ms.

The lab used Debian 13, KVM, an Intel Xeon Platinum 8573C and a four-vCPU quota. Chromium used SwiftShader and Linux WPE WebKit used Mesa software rendering. Physical iPhone, hardware-GPU and carrier-network performance remain untested.

## Walkthroughs

Both recordings used the visible Resume 3D control to show live camera motion throughout. [Desktop, 20.5 s](desktop-walkthrough.mp4) · [Emulated phone, 18.4 s](phone-walkthrough.mp4)

## Public release

The review was merged in [pull request 17](https://github.com/favas5291-coder/portfolio/pull/17). The production commit is `7ba496ec3771499d8412439334df68089a844586`. Its Git tree matches the reviewed head. Render served the new opening from [fazhere.com](https://fazhere.com/) on 20 November 2026.

All 11 public pages returned HTTP 200 with their release content and canonical URLs. The custom 404, sitemap, robots file, HTTP-to-HTTPS redirect and www-to-apex redirect passed. A public Chromium phone-emulation session rendered WebGL, opened the real exhibit, selected the red shirt, switched both widths, returned from the case study, and checked the online-store WhatsApp draft and email destination. The check sent zero messages. [Public routes](public-routes.txt) · [Release assets](live-check.json) · [Live interaction](live-interaction.json)

The portable archive SHA-256 is `4ed8840cd5d2e6e6690335ab054b0c41af84c4fe1b6c5c7dfa4ebb6556e3585b`. Its extracted dist directory matched the reviewed production output byte for byte. [Portable preview](variable-width-preview.tar.gz)
