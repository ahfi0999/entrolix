# Entrolix Website

React and Vite website organized around three services: Training, IT Consulting, and Recruitment.

## Run locally

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

## Email enquiries

The contact address is **info@entrolix.com**. A website or Formspree account does not create this mailbox; it must already be active with your email provider.

Without `VITE_FORM_ENDPOINT`, the contact form prepares a mailto draft. The visitor opens their email app, reviews the draft, and presses Send. The site clearly states that preparing a draft does not send a message.

To enable direct form submissions:

1. Create a Formspree form and verify `info@entrolix.com` as its notification recipient.
2. Copy `frontend/.env.example` to `frontend/.env`.
3. Set `VITE_FORM_ENDPOINT` to the actual endpoint from your Formspree dashboard.
4. Restart the development server, or rebuild the production site. Vite reads this value at build time.
5. Submit an authorized test enquiry and confirm receipt in both Formspree and your mailbox.

The provider controls the recipient; changing the frontend email address alone does not change Formspree delivery. A public form endpoint can be used in a Vite variable, but never place mailbox passwords, SMTP credentials, or secret API keys in `VITE_*` variables.

Service-page enquiry links automatically select the relevant offering. Configured submissions have pending, success, and error states; failed submissions retain the visitor's input.

## Verification

```powershell
cd frontend
npm.cmd run verify:pages
npm.cmd run verify:motion
npm.cmd run build
```

Automated checks cover all page routes, unique titles, content coverage, internal links, service-page sections, dropdown hover/click and keyboard controls, nested mobile navigation, CTA destinations, FAQ disclosures, selected-service enquiries, email-draft generation, mocked submission success/failure, and hydration of pre-rendered content. These are rendered-HTML and simulated-DOM checks, not visual browser testing or proof of real email delivery.

Motion checks additionally cover one-shot reveals, keyboard visibility, pointer throttling, touch/coarse-pointer fallback, scroll progress, visibility suspension, pause persistence, live device-preference changes, unsupported APIs, blocked local storage, and React StrictMode cleanup. Both suites run in CI.

## Hosting

Publish the **contents of `frontend/dist/`**, not the source directory. The static host must serve each route's `index.html` (for example, `/training/ai/index.html`) and use `404.html` for missing pages. The included Nginx configuration implements this for Docker. Preserve nested page output when configuring another host.

Configure `VITE_FORM_ENDPOINT` in the build environment when enabling direct submissions. The Dockerfile accepts it as a build argument.

Before public launch, confirm mailbox delivery, review the approved course and service scope, check desktop/mobile layouts in a real browser, and add verified legal or social links when available.
