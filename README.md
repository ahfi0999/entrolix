# Entrolix Website

React and Vite website organized around three services: Training, IT Consulting, and Recruitment.

## Run locally

Use Node.js 24 (the same major version as CI and Docker). On PowerShell, use
`npm.cmd` to avoid machines that block the `npm.ps1` shim. Vite uses its runner
config loader and an ignored `frontend/.cache/vite/` cache rooted at the config
file; it no longer depends on the launch directory or writes config bundles
inside `node_modules/.vite-temp`.

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
```

For a production build and local preview:

```powershell
npm.cmd run build
npm.cmd run preview -- --host 127.0.0.1 --port 4173
```

The build generates HTML for all 20 pages, plus a not-found page. Each page has its own title, description, and complete readable content before JavaScript loads.

## Page structure

- `/`: homepage introducing the three services
- `/services`: complete service directory
- `/training`
  - `/training/servicenow`
  - `/training/ai`
  - `/training/data-science`
  - `/training/testing`
- `/consulting`
  - `/consulting/servicenow-implementation`
  - `/consulting/servicenow-support`
  - `/consulting/lms`: Learning Management System
  - `/consulting/hrms`: Human Resource Management System
  - `/consulting/rms`: Recruitment Management System
  - `/consulting/crm`: Customer Relationship Management
- `/recruitment`
  - `/recruitment/permanent-staffing`
  - `/recruitment/temporary-staffing`
  - `/recruitment/it-staffing`
- `/about`: company profile, beliefs, vision, and mission
- `/contact`: service-specific enquiries

Each offering explains its audience, scope, intended outcomes, an illustrative learning or delivery example, and what to share when enquiring. Course schedules, fees, delivery formats, project scope, and staffing terms are enquiry-dependent; the website does not invent those details or promise placements.

## Content and maintenance

- `frontend/src/catalog.js`: all three categories and 13 offerings
- `frontend/src/company.js`: company narrative adapted from the supplied About Entrolix PDF
- `frontend/src/contact.js`: company contact address
- `frontend/src/routes.js`: route definitions and page metadata
- `frontend/src/components/`: shared navigation, footer, cards, FAQs, and calls to action
- `frontend/src/pages/`: homepage, category/detail pages, and contact page
- `frontend/src/motion.js`: viewport reveals, pointer effects, and lifecycle cleanup
- `frontend/src/motion.css`: shared motion timings, hero effects, and interaction styling
- `frontend/src/service-design.css`: fixed navigation, green CTAs, and the shared dark-hero/white-body service design
- `frontend/src/pages/home-hero.css`: homepage image, typography, and service navigation strip
- `frontend/src/responsive.css`: final shared mobile/layout safeguards
- `frontend/src/components/MotionProvider.jsx`: device and previously saved animation preferences
- `frontend/scripts/prerender.mjs`: static HTML generation
- `frontend/public/robots.txt`: editable crawler rules; `frontend/dist/` is generated and should not be edited

## Navigation and service-page design

The fixed header contains the Entrolix logo and four primary items: **Home**, **Training Services**, **IT Solutions**, and **Recruitment**. Training lists four courses and an overview link; Recruitment lists three staffing options and an overview link. IT Solutions has exactly two top-level options: **ServiceNow Implementation** and **Custom Applications**. Hovering or clicking Custom Applications opens LMS, HRMS, RMS (Recruitment Management System), and CRM links to their existing detail pages. ServiceNow Support remains available from the consulting overview and footer, not this dropdown. The existing `/consulting` URLs are preserved under the IT Solutions navigation label; About remains available in the footer.

Only one category dropdown opens at a time. Each supports desktop hover, click/tap, Tab, arrow keys, Home/End, Escape, outside-click dismissal, and a nested mobile layout. In IT Solutions, Right Arrow opens Custom Applications and focuses its first link; Left Arrow or Escape closes that submenu and returns focus. Subsequent Escape presses close the category and then the mobile navigation. The custom-application flyout flips left on narrower desktops and expands inline on mobile. The header has no **Our Services** or **Get a Consultation** CTA buttons; service/contact links elsewhere on the site remain available. Header spacing and anchor offsets keep content below the fixed bar, and longer desktop dropdowns can scroll within the viewport.

The refined header uses Manrope at medium weights, a compact 80px desktop/tablet bar and 72px phone bar, consistent 44px-minimum controls, neutral charcoal focus outlines, and an underline for the current category/page. At 768px and above, **Home**, **Training Services**, **IT Solutions**, and **Recruitment** remain visible in one row beside the logo. The old second row and play/pause control are removed. The header height includes its bottom border, and the page offset matches it exactly, leaving no extra spacer. Only phone widths below 768px use a scrollable accordion; custom applications expand inline below 1024px and use a left-side flyout on wider screens. Dropdowns use 300px main panels, a 264px custom-applications flyout, 20px outline icons in 32px containers, compact padding, and 12px panel corners, 10px control corners, borders, shadows, and 200ms fade/slide entrances that respect reduced-motion settings. The original logo wordmark is enlarged using a CSS viewport; its source artwork is unchanged. The header uses neutral charcoal and gray for text, outlines, hover states, borders, and the progress strip; the green page styling remains unchanged. Each offering defines a unique, name-relevant Lucide outline SVG in the shared catalog: AI uses a brain circuit, Data Science a chart, Testing a bug/play symbol, and the other services have distinct workflow, platform, learning, workforce, customer, or staffing icons. The same mapping covers desktop dropdowns, mobile accordions, and the LMS/HRMS/RMS/CRM submenu. Decorative icons never replace link text and require no raster image downloads. Earlier 3D assets are retained unused in `frontend/public/icons/` for reference.

The homepage and all service pages share dark hero sections and lime-green primary calls to action. The service directory, three category pages, and 13 detail pages include white capability sections headed **Where we can help.** and native FAQ accordions headed **Your questions, answered.** Enquiry buttons keep the selected category or offering in the contact URL.

## Motion and accessibility

The website uses native browser animations without an additional animation library:

- Masked headline entrances, staggered section/card reveals, and animated hero lighting/orbits
- Subtle pointer-responsive card tilt and spotlight effects on mouse/trackpad devices
- Scroll progress, navigation and button feedback, FAQ reveals, and mobile-menu entrances
- No play/pause button; device reduced-motion settings and previously saved pause preferences remain respected
- Automatic respect for the device's reduced-motion preference, with immediate updates if that preference changes
- Off-screen and background-tab suspension, frame-batched pointer/scroll updates, and cleanup on unmount

Content is visible in the static HTML and remains readable without animation support. Keyboard focus reveals any pending content immediately. Touch devices do not receive the pointer-tilt effect. There is no scroll hijacking or custom cursor.

To animate a new block, add `data-reveal` and optionally `data-reveal-delay="150"` (milliseconds). Use `data-tilt` for an interactive card and `data-motion-scene` around decorative loops that should pause off-screen. Shared page and service components are already covered by the selectors in `motion.js`.

Before launch, visually check desktop and mobile layouts, mouse and keyboard interaction, flush header/page alignment, and your operating system's reduced-motion setting in a real browser. Automated motion checks use simulated browser APIs; they do not measure frame rate or confirm visual smoothness.

## Email enquiries (Formspree)

The existing form in `frontend/src/pages/ContactPage.jsx` submits directly with POST to **https://formspree.io/f/xzedqjpr**, requesting a JSON response. It works with the existing static hosting setup; no Resend API or private credential is required for this flow.

The public `VITE_FORM_ENDPOINT` value is set in `frontend/.env.local` and documented in `frontend/.env.example`. The component defaults to the same Formspree endpoint if the variable is absent or blank, including Docker builds. Restart Vite after changing environment configuration; rebuild before deploying. Remove any old `/api/enquiry` override from your hosting build settings.

Submitted field names:
- Required: `name`, `email`, `subject`, `message`.
- Optional: `phone`, `company`.
- Hidden spam honeypot: `_gotcha`.

Client validation checks required fields, whitespace, lengths and email format. A synchronous pending guard prevents duplicate submissions, and the fieldset is disabled while sending. Success is shown only after a successful HTTP response with a JSON `ok: true` confirmation and no provider errors. Failed, timed-out, malformed and non-JSON responses keep the input available for retry.

The existing design, field labels, accessibility, service-prefilled subjects, navigation and routes are unchanged. The direct email alternative still points to `info@entrolix.com`.

The notification recipient is controlled by the **Formspree dashboard**, not by the site's contact email. Confirm the intended inbox and any required activation/spam settings there. No real test enquiry was sent during implementation, and inbox delivery is **not verified**. Verify it by submitting an authorized test from `/contact` and confirming arrival in the configured inbox.

The earlier server-side Resend files and private settings are retained but are no longer used by this form. Do not put any API key or mailbox password in `VITE_*` variables. Revoke the Resend key previously shared in chat if it is no longer needed.

Reference: [Formspree AJAX submission guidance](https://formspree.io/blog/formspree-ajax/).

## Verification

```powershell
cd frontend
npm.cmd run verify:pages
npm.cmd run verify:motion
npm.cmd run build
npm.cmd run verify:build
```

Automated checks cover all page routes, unique titles, content coverage, internal links, service-page sections, dropdown hover/click and keyboard controls, nested mobile navigation, CTA destinations, FAQ disclosures, selected-service enquiries, email-draft generation, mocked submission success/failure, and hydration of pre-rendered content. These are rendered-HTML and simulated-DOM checks, not visual browser testing or proof of real email delivery.

Motion checks additionally cover one-shot reveals, keyboard visibility, pointer throttling, touch/coarse-pointer fallback, scroll progress, visibility suspension, pause persistence, live device-preference changes, unsupported APIs, blocked local storage, and React StrictMode cleanup. Both suites run in CI.

`npm.cmd run check` runs all verification and builds in sequence. The build-output
check validates all 21 generated HTML documents, referenced local assets, all 20
public routes over HTTP, deep links, trailing slashes, enquiry parameters, and
true 404 responses (including missing JavaScript assets). It also checks that
the static contact form is disabled until its JavaScript handler is mounted.

## Hosting

Publish the **contents of `frontend/dist/`**, not the source directory. The static host must serve each route's `index.html` (for example, `/training/ai/index.html`) and use `404.html` for missing pages. The included Nginx configuration implements this for Docker. Preserve nested page output when configuring another host.

Configure `VITE_FORM_ENDPOINT` in the build environment when enabling direct submissions. The Dockerfile accepts it as a build argument.

Before public launch, confirm mailbox delivery, review the approved course and service scope, check desktop/mobile layouts in a real browser, and add verified legal or social links when available.

Only fingerprinted `/assets/` files receive year-long immutable caching. Public
images use revalidation so a replacement logo or hero image can appear without
waiting for an old cache entry to expire. HTML uses `no-cache`; Nginx compresses
text responses. Preview returns real 404s instead of the homepage for missing
assets. For a root-domain deployment, publish `frontend/dist/` with directory
indexes and `404.html`. A subdirectory deployment requires a separate base-URL
and absolute-link review.

## Frontend audit and implementation — 19 October 2026

### Existing architecture and preserved features

- React 19.2.8, React DOM, Vite 8.2.2, Lucide React; plain CSS, no UI kit,
  router package, animation package, CMS, database, or application backend.
- `src/routes.js` maps the URL to one shared application; `catalog.js` supplies
  three categories and 13 offerings. `company.js` retains the existing company
  copy. `components/` holds navigation, footer, cards, FAQs and motion preferences;
  `pages/` holds the homepage, shared service templates and contact form.
- All 20 public pages, the 404 page, Home / Training Services / IT Solutions /
  Recruitment navigation, nested custom-application links, keyboard and touch
  interaction, service-prefilled enquiries, mailto drafts, configured form
  submission, native FAQs, legacy links and reduced-motion support are preserved.
- Manrope headings/navigation, DM Sans body text, Georgia italic accents,
  dark forest-green heroes, lime CTAs and service-category accents are retained.
  Fonts remain Google-hosted with `display=swap` and local fallback fonts.
- The homepage uses the existing AI-generated collaboration image (214,655
  bytes), not a claimed staff photo. The original logo and four unused 3D icon
  source images are preserved. No clients, testimonials, metrics or new company
  facts were added.
- CI installs with `npm ci`, tests, builds, and now checks the generated site.
  Docker builds with Node 24 and serves static output with Nginx; no public
  deployment is performed by this work.

### Findings and changes

| Finding | Evidence and resolution |
| --- | --- |
| Fragile local startup | Prior EPERM errors occurred under `node_modules/.vite-temp`; the cache workaround resolved outside the repository using the shell directory. Scripts now use the runner loader, and cache paths resolve from the config file into ignored `.cache/vite/`. |
| Missing assets masked as successful pages | The new HTTP test reproduced `/assets/missing-file.js` returning 200 HTML in preview. Preview now returns 404 for missing assets and pages. |
| Stale public images after release | Nginx previously marked all image filenames immutable for one year. Only Vite's fingerprinted output is now immutable; stable public filenames revalidate. |
| Form before hydration | The prerendered form originally had enabled inputs and no native submission method/action, permitting default GET submission without its JS handler. Its fieldset is now disabled before hydration, with a no-JavaScript email alternative. |
| JavaScript-only primary navigation | Added a no-JavaScript category/contact link list while preserving the interactive header. |
| Mobile usability risks found in CSS | Form controls were 15px; mobile footer links were small; long grid content had no shared minimum-width safeguard. Added 16px controls, 44px mobile footer/link targets, grid shrink rules, long-heading wrapping, and narrow-screen hero adjustments. These are code-reviewed improvements, not measured browser-layout results. |
| CSS ordering and font discovery | Homepage CSS was imported through a component before global overrides. Styles now have an explicit order in `main.jsx`; the Google Fonts stylesheet is discovered in the HTML head rather than through CSS `@import`. |
| Generic enquiry CTAs | Service heroes now name the training, requirements or hiring action while retaining all existing contact destinations and query parameters. |
| Unused dependencies | Removed the unused React Vite plugin, ESLint packages, Testing Library packages, globals and Vitest. The project uses its own Node assertion suites and JSDOM. Vite moved to devDependencies. |

Removed declarations: `@vitejs/plugin-react`, `@eslint/js`,
`@testing-library/jest-dom`, `@testing-library/react`, `eslint`,
`eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`, `vitest`.
No packages were added. Runtime dependencies are React, React DOM and Lucide;
development dependencies are Vite and JSDOM. The lockfile package-entry count
decreased from 242 to 83. Existing installed packages are reconciled by the next
`npm ci`; no source assets were deleted.

### Verification and remaining release checks

The build, page suite, motion suite and build-output/HTTP suite pass. The page
suite checks 20 pages and 1,090 internal links, header keyboard/touch behavior,
enquiry prefill, draft creation, mocked submission outcomes and hydration.
The production bundle is approximately 85.2 KB of gzipped JavaScript and
11.7 KB of gzipped CSS. No missing referenced local assets were found.

No browser or desktop surface was connected during this audit. Real browser
console errors, pixel layout, actual mobile overflow, focus visibility and
font/network loading therefore remain unverified; simulated DOM checks do not
establish those results. Check at 320, 375, 768, 1024 and 1440px before publishing.
The Docker CLI is installed but the Docker engine is stopped, so the Nginx
container/configuration has not been executed. Mailbox ownership, live Formspree
delivery, production domain and legal content require the owner's verified
configuration; a working email-draft flow remains available without a provider.

Practical release sequence for today: run `npm.cmd ci` and `npm.cmd run check`,
review the above browser sizes and keyboard flows, confirm the intended enquiry
mode, and publish `frontend/dist/` to the approved root-domain static host with
directory-index routing. The optional Docker flow is `docker build -t
entrolix-web ./frontend` then `docker run --rm -p 8080:80 entrolix-web`.
For direct form delivery, pass the verified `VITE_FORM_ENDPOINT` at build time.

Deferred maintenance: old, unused hero/legacy service CSS can be removed in a
separate visual-regression pass; self-hosted fonts, canonical URLs, a sitemap and
social-share URLs can follow once the production origin and hosting are confirmed.
None requires adding a framework or replacing the current architecture.

Configuration references: [Vite cache directory](https://vite.dev/config/shared-options.html#cachedir)
and [Nginx response headers](https://nginx.org/en/docs/http/ngx_http_headers_module.html).
