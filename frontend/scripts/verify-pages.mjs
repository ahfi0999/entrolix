import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { readFile } from 'node:fs/promises'
import { createElement, act } from 'react'
import { renderToString } from 'react-dom/server'
import { createServer } from 'vite'

const server = await createServer({
  configLoader: 'runner',
  root: fileURLToPath(new URL('../', import.meta.url)),
  server: { middlewareMode: true, watch: null, ws: false },
  optimizeDeps: { noDiscovery: true, include: [] },
  appType: 'custom',
})
try {
  const { default: App } = await server.ssrLoadModule('/src/App.jsx')
  const { default: ContactPage } = await server.ssrLoadModule('/src/pages/ContactPage.jsx')
  const { pagePaths, resolveRoute } = await server.ssrLoadModule('/src/routes.js')
  const { offerings, serviceGroups } = await server.ssrLoadModule('/src/catalog.js')
  assert.equal(serviceGroups.length, 3)
  assert.equal(offerings.length, 13)
  assert.equal(pagePaths.length, 20)
  const rendered = new Map(pagePaths.map(path => [path, renderToString(createElement(App, { initialPath: path }))]))
  let checkedLinks = 0
  for (const [pathname, html] of rendered) {
    const route = resolveRoute(pathname)
    assert.equal((html.match(/<main[ >]/g) || []).length, 1, pathname + ': one main landmark')
    assert.equal((html.match(/<h1[ >]/g) || []).length, 1, pathname + ': one primary heading')
    assert.equal(route.title, 'Entrolix', pathname + ': consistent browser title')
    assert.equal(resolveRoute(pathname + '/').type, route.type, pathname + ': trailing slash')
    if (['services', 'category', 'offering'].includes(route.type)) {
      assert.ok(html.includes('class="service-hero"'), pathname + ': shared dark hero')
      assert.ok(html.includes('button button-lime'), pathname + ': existing hero CTA hook preserved')
      assert.ok(html.includes(route.type === 'offering' ? 'class="detail-section"' : 'service-capabilities'), pathname + ': capability section')
      assert.ok(html.includes('Your questions, answered.'), pathname + ': FAQ section')
      assert.ok(html.includes('<details>'), pathname + ': native FAQ disclosures')
    }
    for (const match of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)) {
      const href = match[1].replace(/&amp;/g, '&')
      if (href.startsWith('mailto:')) continue
      const url = new URL(href, 'http://entrolix.test' + pathname)
      assert.ok(rendered.has(url.pathname), pathname + ': unknown internal link ' + href)
      if (url.hash) assert.ok(rendered.get(url.pathname).includes('id="' + url.hash.slice(1) + '"'), pathname + ': missing anchor ' + href)
      const service = url.searchParams.get('service')
      if (service) assert.ok(offerings.some(item => item.group + '/' + item.slug === service), 'Unknown enquiry service')
      checkedLinks++
    }
  }
  for (const item of offerings) {
    const html = rendered.get('/' + item.group + '/' + item.slug)
    for (const text of [item.title, item.audience, ...item.scope, ...item.results]) {
      assert.ok(html.includes(text.replace(/&/g, '&amp;')), item.title + ': missing detail ' + text)
    }
  }
  assert.equal(resolveRoute('/missing-page').type, 'not-found')
  assert.equal(resolveRoute('/missing-page').title, 'Entrolix', 'Not-found pages retain the brand title')
  assert.match(rendered.get('/contact'), /<fieldset disabled=""/, 'Static form stays disabled before hydration')
  assert.match(rendered.get('/contact'), /<noscript>.*?mailto:info@entrolix\.com/s, 'Contact offers a no-JavaScript email fallback')
  assert.ok(rendered.get('/consulting/rms').includes('recruitment management system'))
  console.log('PASS 20 pages: all 13 offerings, complete detail content, Entrolix titles, trailing slashes, and ' + checkedLinks + ' internal links')

  const { JSDOM, VirtualConsole } = await import('jsdom')
  const offeringIcons = {
    '/training/servicenow': 'workflow',
    '/training/ai': 'brain-circuit',
    '/training/data-science': 'chart-no-axes-combined',
    '/training/testing': 'bug-play',
    '/consulting/servicenow-implementation': 'cloud-cog',
    '/consulting/servicenow-support': 'headset',
    '/consulting/lms': 'graduation-cap',
    '/consulting/hrms': 'users-round',
    '/consulting/rms': 'user-search',
    '/consulting/crm': 'handshake',
    '/recruitment/permanent-staffing': 'badge-check',
    '/recruitment/temporary-staffing': 'calendar-clock',
    '/recruitment/it-staffing': 'laptop-minimal',
  }
  const catalogIcons = offerings.map(item => {
    assert.ok(item.icon, item.title + ': service-specific icon is defined')
    const icon = JSDOM.fragment(renderToString(createElement(item.icon))).querySelector('svg')
    assert.ok(icon.classList.contains('lucide-' + offeringIcons['/' + item.group + '/' + item.slug]), item.title + ': relevant icon mapping')
    return icon.innerHTML
  })
  assert.equal(new Set(catalogIcons).size, offerings.length, 'All 13 offerings use different icon artwork')
  for (const [pathname, html] of rendered) {
    const page = new JSDOM(html)
    const navigation = page.window.document.querySelector('.primary-links')
    assert.equal(page.window.document.querySelectorAll('header .reference-nav-cta').length, 1, pathname + ': one reference contact CTA')
    assert.equal(page.window.document.querySelector('header .reference-nav-cta').getAttribute('href'), '/contact')
    for (const selector of ['header .header-brand', 'footer .footer-wordmark']) {
      const brand = page.window.document.querySelector(selector)
      assert.equal(brand.getAttribute('href'), '/')
      assert.equal(brand.getAttribute('aria-label'), 'Entrolix home')
      assert.equal(brand.querySelector('img').getAttribute('src'), '/entrolix-wordmark-dark-v2.png')
      assert.equal(brand.querySelector('img').getAttribute('alt'), '', 'The link provides the accessible brand name')
      assert.equal(brand.querySelector('img').getAttribute('width'), '180')
      assert.equal(brand.querySelector('img').getAttribute('height'), '50')
      assert.equal(brand.querySelector('span'), null, 'Use the supplied full wordmark without duplicate text')
    }
    assert.equal(page.window.document.querySelector('header').classList.contains('reference-header--home'), pathname === '/')
    assert.equal(page.window.document.querySelector('.motion-toggle'), null, pathname + ': no play/pause control')
    assert.equal(page.window.document.querySelectorAll('.header-controls button').length, 1, pathname + ': only the mobile menu control remains')
    assert.ok(!page.window.document.querySelector('header').textContent.includes('Our Services'), pathname + ': no Our Services header CTA')
    assert.ok(!page.window.document.querySelector('header').textContent.includes('Get a Consultation'), pathname + ': no consultation header CTA')
    assert.ok(page.window.document.querySelector('footer a[href="/contact"]'), pathname + ': contact remains available in the footer')
    const currentGroup = serviceGroups.find(group => pathname === '/' + group.id || pathname.startsWith('/' + group.id + '/'))
    const active = navigation.querySelectorAll('[aria-current]')
    if (pathname === '/') assert.equal(navigation.querySelector(':scope > a').getAttribute('aria-current'), 'page')
    else if (currentGroup) {
      assert.equal(navigation.querySelector('#' + currentGroup.id + '-menu-trigger').getAttribute('aria-current'), 'true')
      assert.ok(navigation.querySelector('#' + currentGroup.id + '-menu-trigger').classList.contains('active'))
    } else if (pathname === '/about' || pathname === '/contact') {
      assert.equal(navigation.querySelector(`a[href="${pathname}"]`).getAttribute('aria-current'), 'page')
      assert.equal(active.length, 1)
    } else assert.equal(active.length, 0)
    assert.equal(navigation.querySelectorAll('.dropdown-icon img').length, 0, pathname + ': no raster dropdown icons')
    assert.equal(page.window.document.querySelectorAll('header img[src^="/icons/"]').length, 0, pathname + ': no header icon image downloads')
    const icons = navigation.querySelectorAll('.dropdown-icon > svg')
    assert.equal(icons.length, 13, pathname + ': every service row, including nested applications, has an outline icon')
    assert.equal(new Set([...icons].map(icon => icon.innerHTML)).size, icons.length, pathname + ': no repeated service icon artwork')
    for (const [href, iconName] of Object.entries(offeringIcons)) {
      // Support remains a page offering, not a third top-level IT Solutions option.
      if (href === '/consulting/servicenow-support') continue
      const icon = navigation.querySelector('a[href="' + href + '"] .dropdown-icon > svg')
      assert.ok(icon?.classList.contains('lucide-' + iconName), pathname + ': correct service icon for ' + href)
    }
    assert.ok(navigation.querySelector('#custom-applications-trigger .lucide-layout-grid'), pathname + ': custom applications has its own grid icon')
    for (const icon of icons) {
      assert.equal(icon.getAttribute('width'), '20')
      assert.equal(icon.getAttribute('height'), '20')
      assert.equal(icon.getAttribute('stroke'), 'currentColor')
      assert.equal(icon.getAttribute('stroke-width'), '1.75')
      assert.equal(icon.getAttribute('fill'), 'none')
      assert.equal(icon.getAttribute('focusable'), 'false')
      assert.equal(icon.parentElement.getAttribute('aria-hidden'), 'true')
    }
    assert.equal(page.window.document.querySelector('.header-brand').getAttribute('aria-label'), 'Entrolix home')
    page.window.close()
  }
  const headerStyles = await readFile(new URL('../src/service-design.css', import.meta.url), 'utf8')
  const referenceStyles = await readFile(new URL('../src/components/reference-header.css', import.meta.url), 'utf8')
  const footerStyles = await readFile(new URL('../src/components/site-closing.css', import.meta.url), 'utf8')
  for (const [css, selector] of [[referenceStyles, '.site-header.reference-header .reference-brand-wordmark'], [footerStyles, '.site-footer .footer-wordmark img']]) {
    const logoRule = css.slice(css.indexOf(selector)).split('}')[0]
    assert.ok(logoRule.includes('object-fit: contain'), 'Logo must not be cropped')
    assert.ok(!logoRule.includes('filter:'), 'Logo antialiased edges must not be thresholded')
    assert.ok(logoRule.includes('width: 180px; height: 72px'), 'Logo box preserves the complete canvas aspect ratio')
  }
  assert.ok(referenceStyles.includes("font-family: 'DM Sans', sans-serif"))
  assert.ok(referenceStyles.includes('linear-gradient(90deg, #50caff, #c185ff)'), 'Reference active-link gradient')
  assert.ok(referenceStyles.includes('.reference-header--home ~ .home-page'), 'Homepage image extends behind navbar')
  assert.ok(referenceStyles.includes('[data-header-scrolled="true"]'), 'Scrolled header remains readable regardless of motion preference')
  assert.ok(referenceStyles.includes('@media (max-width: 1023px)'), 'Six navigation items collapse on tablets')
  assert.ok(referenceStyles.includes('max-height: calc(100dvh - var(--header-height))'), 'Mobile navigation stays scrollable')
  assert.ok(headerStyles.includes('.services-trigger.active::after'))
  assert.ok(headerStyles.includes('width: min(300px, calc(100vw - 40px))'), 'Compact 300px primary dropdowns')
  assert.ok(headerStyles.includes('width: 264px; padding-left: 8px'), 'Compact custom-applications flyout')
  assert.ok(headerStyles.includes('min-height: 50px; padding: 8px 9px'), 'Reduced row padding retains accessible targets')
  assert.ok(headerStyles.includes('@media (min-width: 768px) and (max-width: 1200px)'))
  assert.ok(headerStyles.includes('.site-header .main-nav { display: flex;'), 'Navigation uses one row')
  assert.ok(!headerStyles.includes('--header-height: 136px'), 'No reserved second-row header space')
  assert.ok(headerStyles.includes('height: calc(var(--header-height) - 1px)'), 'Navigation height includes the 1px header border')
  assert.ok(headerStyles.includes('.site-shell { padding-top: var(--header-height); }'), 'Page offset matches the fixed header height')
  assert.ok(headerStyles.includes('.site-header .header-controls { display: none; }'), 'Removed controls leave no empty desktop slot')
  assert.ok(headerStyles.includes('@media (max-width: 767px)'))
  assert.ok(headerStyles.includes('@media (prefers-reduced-motion: reduce)'))
  assert.ok(!headerStyles.includes('\\n'), 'Styles must not contain escaped line breaks')
  const luminance = hex => {
    const channels = hex.match(/\w\w/g).map(value => parseInt(value, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
    return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722
  }
  const navColors = Object.fromEntries(['text', 'muted', 'active', 'border', 'highlight'].map(name => {
    const match = referenceStyles.match(new RegExp('--nav-' + name + ':\\s*#([a-f0-9]{6})', 'i'))
    assert.ok(match, 'Header color token exists: ' + name)
    return [name, match[1]]
  }))
  assert.ok(headerStyles.includes('.reading-progress span { background: #525252; }'), 'Header progress strip is neutral')
  assert.ok(headerStyles.includes('.dropdown-icon svg { width: 20px; height: 20px; fill: none; }'), 'Compact outline SVG styling')
  for (const [foreground, background] of [[navColors.text, '08121e'], [navColors.active, navColors.highlight], [navColors.muted, '0c1827'], [navColors.muted, navColors.highlight]]) {
    const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
    assert.ok((values[0] + .05) / (values[1] + .05) >= 4.5, 'Header text contrast: ' + foreground + ' on ' + background)
  }
  console.log('PASS header presentation: reference branding, six links, contact CTA, dark palette, home overlay, scroll state, mobile/reduced-motion rules, outline icons and text contrast')
  const domErrors = []
  const virtualConsole = new VirtualConsole().on('jsdomError', error => domErrors.push(error))
  const dom = new JSDOM('<!doctype html><html><head><title>Entrolix</title><meta name="description"><meta property="og:title"><meta property="og:description"><meta name="robots"></head><body><div id="root"></div></body></html>', { url: 'http://localhost/training', virtualConsole })
  globalThis.window = dom.window
  globalThis.document = dom.window.document
  globalThis.FormData = dom.window.FormData
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  // React detects browser input support when this module loads. Initialize the
  // DOM first so focus/change tests do not enter its legacy IE event fallback.
  const { createRoot, hydrateRoot } = await import('react-dom/client')
  dom.window.HTMLElement.prototype.scrollIntoView = function () {}
  let root = createRoot(document.getElementById('root'))
  await act(async () => root.render(createElement(App, { initialPath: '/training' })))
  assert.equal(document.title, 'Entrolix')
  const toggle = document.querySelector('.menu-button')
  await act(async () => toggle.click())
  assert.equal(toggle.getAttribute('aria-expanded'), 'true')
  await act(async () => window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' })))
  assert.equal(toggle.getAttribute('aria-expanded'), 'false')
  assert.equal(document.activeElement, toggle)
  const navItems = [...document.querySelectorAll('.primary-links > a, .primary-links > .services-disclosure > button')]
  assert.deepEqual(navItems.map(item => item.textContent.trim()), ['Home', 'Training Services', 'IT Solutions', 'Recruitment', 'About', 'Contact'])
  assert.equal(document.querySelector('header .reference-nav-cta').textContent.trim(), 'Get in Touch')
  await act(async () => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 100 })
    window.dispatchEvent(new window.Event('scroll'))
  })
  assert.equal(document.querySelector('header').dataset.headerScrolled, 'true')
  await act(async () => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 })
    window.dispatchEvent(new window.Event('scroll'))
  })
  assert.equal(document.querySelector('header').dataset.headerScrolled, 'false')
  const key = (target, value) => target.dispatchEvent(new window.KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true }))
  const triggers = serviceGroups.map(group => document.getElementById(group.id + '-menu-trigger'))
  const dropdowns = serviceGroups.map(group => document.getElementById(group.id + '-dropdown'))
  for (const [index, group] of serviceGroups.entries()) {
    const trigger = triggers[index]
    const dropdown = dropdowns[index]
    const links = [...dropdown.querySelectorAll('[data-dropdown-item]')]
    assert.equal(dropdown.hidden, true)
    assert.equal(trigger.getAttribute('aria-controls'), dropdown.id)
    if (group.id === 'consulting') {
      assert.deepEqual(links.map(item => item.querySelector('strong').textContent), ['ServiceNow Implementation', 'Custom Applications'])
      assert.deepEqual(links.map(item => item.tagName), ['A', 'BUTTON'])
      assert.equal(links[0].getAttribute('href'), '/consulting/servicenow-implementation')
      assert.deepEqual([...dropdown.querySelectorAll('a')].map(link => link.getAttribute('href')), ['/consulting/servicenow-implementation', '/consulting/lms', '/consulting/hrms', '/consulting/rms', '/consulting/crm'])
    } else {
      assert.deepEqual(links.map(link => link.getAttribute('href')), [...offerings.filter(item => item.group === group.id).map(item => '/' + item.group + '/' + item.slug), '/' + group.id])
    }
    await act(async () => key(trigger, 'ArrowDown'))
    assert.equal(dropdown.hidden, false)
    assert.equal(document.activeElement, links[0])
    await act(async () => key(links[0], 'ArrowDown'))
    assert.equal(document.activeElement, links[1])
    await act(async () => key(links[1], 'End'))
    assert.equal(document.activeElement, links.at(-1))
    await act(async () => key(links.at(-1), 'Home'))
    assert.equal(document.activeElement, links[0])
    await act(async () => key(links[0], 'Escape'))
    assert.equal(dropdown.hidden, true)
    assert.equal(document.activeElement, trigger)
    await act(async () => key(trigger, 'ArrowUp'))
    assert.equal(document.activeElement, links.at(-1))
    await act(async () => key(links.at(-1), 'Escape'))
    await act(async () => trigger.click())
    assert.equal(trigger.getAttribute('aria-expanded'), 'true')
    await act(async () => document.body.dispatchEvent(new window.Event('pointerdown', { bubbles: true })))
    assert.equal(dropdown.hidden, true, 'Outside click dismisses ' + group.id)
    await act(async () => trigger.click())
    await act(async () => document.querySelector('.brand').focus())
    assert.equal(dropdown.hidden, true, 'Focus outside dismisses ' + group.id)
  }
  for (const [index, trigger] of triggers.entries()) {
    await act(async () => trigger.click())
    assert.deepEqual(dropdowns.map(dropdown => dropdown.hidden), dropdowns.map((_, current) => current !== index), 'Only the selected dropdown stays open')
  }
  await act(async () => document.body.dispatchEvent(new window.Event('pointerdown', { bubbles: true })))
  const originalMatchMedia = window.matchMedia
  window.matchMedia = query => ({ matches: query.includes('hover: hover') })
  const pointer = (target, type, pointerType = 'mouse', relatedTarget = document.body) => {
    const event = new window.MouseEvent(type, { bubbles: true, relatedTarget })
    Object.defineProperty(event, 'pointerType', { value: pointerType })
    target.dispatchEvent(event)
  }
  for (const [index, trigger] of triggers.entries()) {
    await act(async () => pointer(trigger, 'pointerover'))
    assert.equal(dropdowns[index].hidden, false, 'Desktop hover opens ' + trigger.textContent)
    await act(async () => pointer(trigger, 'pointerout'))
    assert.equal(dropdowns[index].hidden, true, 'Pointer leave closes the hovered dropdown')
    await act(async () => pointer(trigger, 'pointerover', 'touch'))
    assert.equal(dropdowns[index].hidden, true, 'Touch never depends on hover')
  }
  await act(async () => key(triggers[0], 'ArrowDown'))
  await act(async () => pointer(triggers[1], 'pointerover'))
  assert.equal(dropdowns[0].hidden, false, 'Incidental hover does not hide a keyboard-focused link')
  assert.equal(dropdowns[1].hidden, true)
  await act(async () => key(document.activeElement, 'Escape'))

  const itTrigger = triggers[1]
  const itDropdown = dropdowns[1]
  const implementationLink = itDropdown.querySelector('[data-dropdown-item]')
  const customTrigger = document.getElementById('custom-applications-trigger')
  const customSubmenu = document.getElementById('custom-applications-submenu')
  const customLinks = [...customSubmenu.querySelectorAll('a')]
  assert.deepEqual(customLinks.map(link => link.querySelector('strong').textContent), ['LMS', 'HRMS', 'RMS', 'CRM'])
  assert.equal(customLinks[2].querySelector('small').textContent, 'Recruitment Management System')
  assert.equal(customTrigger.getAttribute('aria-controls'), customSubmenu.id)
  assert.equal(customSubmenu.hidden, true)
  await act(async () => pointer(itTrigger, 'pointerover'))
  assert.equal(itDropdown.hidden, false)
  // React derives enter/leave from paired pointerout/over events between siblings.
  await act(async () => {
    pointer(itTrigger, 'pointerout', 'mouse', customTrigger)
    pointer(customTrigger, 'pointerover', 'mouse', itTrigger)
  })
  assert.equal(customSubmenu.hidden, false, 'Hover Custom Applications opens its submenu')
  assert.equal(customTrigger.getAttribute('aria-expanded'), 'true')
  await act(async () => pointer(customTrigger, 'pointerout', 'mouse', customLinks[0]))
  await act(async () => pointer(customLinks[0], 'pointerover', 'mouse', customTrigger))
  assert.equal(customSubmenu.hidden, false, 'Moving from the trigger into its flyout keeps both levels open')
  assert.equal(itDropdown.hidden, false)
  await act(async () => pointer(customLinks[0], 'pointerout', 'mouse', implementationLink))
  assert.equal(customSubmenu.hidden, true, 'Leaving the custom branch closes only the flyout')
  assert.equal(itDropdown.hidden, false)
  await act(async () => pointer(customTrigger, 'pointerover', 'touch', implementationLink))
  assert.equal(customSubmenu.hidden, true)
  await act(async () => customTrigger.click())
  assert.equal(customSubmenu.hidden, false, 'Click/tap opens custom systems without hover')
  await act(async () => customLinks[0].focus())
  await act(async () => pointer(customLinks[0], 'pointerout', 'mouse', implementationLink))
  assert.equal(customSubmenu.hidden, false, 'Pointer movement preserves a keyboard-focused submenu link')
  await act(async () => implementationLink.focus())
  assert.equal(customSubmenu.hidden, true, 'Focus leaving the branch dismisses the submenu')
  await act(async () => customTrigger.click())
  await act(async () => triggers[2].click())
  assert.equal(customSubmenu.hidden, true, 'Switching category closes the custom submenu')
  await act(async () => itTrigger.click())
  assert.equal(customSubmenu.hidden, true, 'Reopening IT Solutions does not retain stale submenu state')
  await act(async () => key(itTrigger, 'ArrowUp'))
  assert.equal(document.activeElement, customTrigger, 'Top-level arrows exclude hidden nested links')
  await act(async () => key(customTrigger, 'ArrowRight'))
  assert.equal(document.activeElement, customLinks[0])
  await act(async () => key(customLinks[0], 'ArrowDown'))
  assert.equal(document.activeElement, customLinks[1])
  await act(async () => key(customLinks[1], 'End'))
  assert.equal(document.activeElement, customLinks.at(-1))
  await act(async () => key(customLinks.at(-1), 'ArrowDown'))
  assert.equal(document.activeElement, customLinks[0], 'Nested arrows wrap within custom applications')
  await act(async () => key(customLinks[0], 'ArrowUp'))
  assert.equal(document.activeElement, customLinks.at(-1))
  await act(async () => key(customLinks.at(-1), 'Home'))
  assert.equal(document.activeElement, customLinks[0])
  await act(async () => key(customLinks[0], 'ArrowLeft'))
  assert.equal(customSubmenu.hidden, true)
  assert.equal(itDropdown.hidden, false)
  assert.equal(document.activeElement, customTrigger)
  await act(async () => key(customTrigger, 'ArrowRight'))
  await act(async () => key(customLinks[0], 'Escape'))
  assert.equal(customSubmenu.hidden, true)
  assert.equal(itDropdown.hidden, false, 'Escape dismisses only the innermost level')
  assert.equal(document.activeElement, customTrigger)
  await act(async () => customTrigger.click())
  await act(async () => document.body.dispatchEvent(new window.Event('pointerdown', { bubbles: true })))
  assert.equal(itDropdown.hidden, true)
  assert.equal(customSubmenu.hidden, true, 'Outside click closes both dropdown levels')
  window.matchMedia = originalMatchMedia
  for (const [index, trigger] of triggers.entries()) {
    await act(async () => toggle.click())
    await act(async () => trigger.click())
    await act(async () => key(trigger, 'Escape'))
    assert.equal(dropdowns[index].hidden, true)
    assert.equal(toggle.getAttribute('aria-expanded'), 'true', 'First Escape only closes the nested dropdown')
    await act(async () => key(trigger, 'Escape'))
    assert.equal(toggle.getAttribute('aria-expanded'), 'false')
    assert.equal(document.activeElement, toggle)
  }
  await act(async () => toggle.click())
  await act(async () => itTrigger.click())
  await act(async () => customTrigger.click())
  await act(async () => customLinks[0].focus())
  await act(async () => key(customLinks[0], 'Escape'))
  assert.equal(customSubmenu.hidden, true)
  assert.equal(itDropdown.hidden, false)
  assert.equal(toggle.getAttribute('aria-expanded'), 'true')
  await act(async () => key(customTrigger, 'Escape'))
  assert.equal(itDropdown.hidden, true)
  assert.equal(toggle.getAttribute('aria-expanded'), 'true')
  await act(async () => key(itTrigger, 'Escape'))
  assert.equal(toggle.getAttribute('aria-expanded'), 'false')
  assert.equal(document.activeElement, toggle)
  await act(async () => toggle.click())
  await act(async () => itTrigger.click())
  await act(async () => customTrigger.click())
  customLinks[0].addEventListener('click', event => event.preventDefault(), { once: true })
  await act(async () => customLinks[0].click())
  assert.equal(customSubmenu.hidden, true)
  assert.equal(itDropdown.hidden, true)
  assert.equal(toggle.getAttribute('aria-expanded'), 'false', 'Following a custom application closes all navigation levels')
  const summary = document.querySelector('summary')
  summary.click()
  assert.ok(summary.parentElement.open)
  await act(async () => root.unmount())
  console.log('PASS navigation: six primary items and contact CTA, scroll state, exactly two IT Solutions options, LMS/HRMS/RMS/CRM flyout, hover/click, keyboard focus, three-level mobile Escape, dismissals and FAQs')

  const input = name => document.querySelector(`[name="${name}"]`)
  const values = { name: 'Casey Test', email: 'casey@example.com', phone: '+44 20 1234 5678', company: 'Test & Review', subject: 'A platform enquiry & next steps', message: 'We need candidate tracking & interview feedback.' }
  const fill = (overrides = {}) => Object.entries({ ...values, ...overrides }).forEach(([name, value]) => { input(name).value = value })
  const send = () => act(async () => document.querySelector('form').requestSubmit())
  const mountContact = async (endpoint, path = '/contact') => {
    window.history.replaceState({}, '', path)
    root = createRoot(document.getElementById('root'))
    await act(async () => root.render(createElement(ContactPage, { endpoint })))
  }
  let networkCalls = 0
  globalThis.fetch = async () => { networkCalls++; throw new Error('Unexpected live network call') }
  await mountContact('https://formspree.io/f/xzedqjpr')
  assert.equal(document.querySelector('fieldset').disabled, false)
  assert.equal(document.querySelector('h1').textContent, "Let's start a conversation.")
  assert.equal(document.querySelector('select'), null, 'No service or category selector')
  assert.deepEqual([...document.querySelectorAll('fieldset input, fieldset textarea')].map(field => field.name), Object.keys(values), 'Exactly six fields in the requested order')
  assert.equal(document.querySelectorAll('form [required]').length, 4)
  assert.equal(input('phone').required, false)
  assert.equal(input('company').required, false)
  await send()
  assert.equal(document.querySelectorAll('[aria-invalid="true"]').length, 4, 'Required-field errors are inline')
  assert.equal(document.activeElement, input('name'), 'Focus moves to first invalid field')
  for (const field of document.querySelectorAll('[aria-invalid="true"]')) {
    assert.ok(document.getElementById(field.getAttribute('aria-describedby'))?.textContent, 'Field error is associated')
  }
  assert.ok(document.querySelector('[role="alert"]'))
  assert.equal(networkCalls, 0)
  fill({ name: '   ', subject: '  ', message: '   ' })
  await send()
  assert.equal(document.querySelectorAll('[aria-invalid="true"]').length, 3, 'Whitespace is not accepted as required content')
  fill({ email: 'not-an-email' })
  await send()
  assert.equal(document.querySelectorAll('[aria-invalid="true"]').length, 1)
  assert.ok(document.getElementById('enquiry-email-error').textContent.includes('valid email'))
  assert.equal(document.activeElement, input('email'))
  await act(async () => {
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input('email'), values.email)
    input('email').dispatchEvent(new window.Event('input', { bubbles: true }))
  })
  assert.equal(document.getElementById('enquiry-email-error'), null, 'Inline error clears as the visitor corrects the value')
  input('email').value = 'still-invalid'
  await act(async () => input('email').dispatchEvent(new window.FocusEvent('focusout', { bubbles: true })))
  assert.ok(document.getElementById('enquiry-email-error'), 'Validation also runs on leaving a field')
  fill({ email: 'name@', subject: 'x'.repeat(181) })
  await send()
  assert.ok(document.getElementById('enquiry-subject-error'))
  assert.equal(networkCalls, 0)
  fill()
  input('_gotcha').value = 'bot-filled'
  await send()
  assert.equal(networkCalls, 0, 'Honeypot prevents submission')
  assert.equal(document.querySelector('.form-success'), null)
  await act(async () => root.unmount())
  console.log('PASS enquiry validation: six ordered fields, no selector, required/whitespace/email/length errors, accessible error associations, focus, optional fields and honeypot')

  await mountContact('', '/contact?service=consulting%2Frms')
  assert.equal(input('subject').value, 'Enquiry: Custom RMS Development')
  fill()
  await send()
  const draft = document.querySelector('.email-draft a')
  assert.ok(draft)
  const email = new URL(draft.href)
  assert.equal(email.pathname, 'info@entrolix.com')
  assert.equal(email.searchParams.get('subject'), values.subject, 'Visitor can edit the prefilled subject')
  assert.ok(email.searchParams.get('body').includes(values.company))
  assert.ok(email.searchParams.get('body').includes(values.phone))
  assert.ok(email.searchParams.get('body').includes(values.message))
  assert.ok(document.querySelector('.email-draft').textContent.includes('Nothing has been sent yet'))
  assert.equal(document.querySelector('.form-success'), null)
  assert.equal(input('name').value, values.name, 'Draft preparation retains input')
  assert.equal(networkCalls, 0)
  fill({ phone: '', company: '' })
  await send()
  assert.ok(new URL(document.querySelector('.email-draft a').href).searchParams.get('body').includes('Phone: Not provided'))
  await act(async () => root.unmount())
  console.log('PASS email fallback: encoded six-field draft, editable subject, optional empty fields, input retention, no network or fake success')

  for (const item of offerings) {
    await mountContact('', '/contact?service=' + encodeURIComponent(item.group + '/' + item.slug))
    assert.equal(input('subject').value, 'Enquiry: ' + item.title)
    await act(async () => root.unmount())
  }
  for (const group of serviceGroups) {
    await mountContact('', '/contact?category=' + group.id)
    assert.equal(input('subject').value, 'Enquiry: ' + group.title)
    await act(async () => root.unmount())
  }
  await mountContact('', '/contact?service=not-real&category=not-real')
  assert.equal(input('subject').value, '', 'Unknown query values are not inserted')
  await act(async () => root.unmount())
  console.log('PASS all 13 service and 3 category enquiry URLs: subject prefill without a dropdown')

  let submission
  let finishRequest
  globalThis.fetch = (url, options) => {
    networkCalls++
    submission = { url, options }
    return new Promise(resolve => { finishRequest = resolve })
  }
  await mountContact('https://formspree.io/f/xzedqjpr')
  fill()
  const form = document.querySelector('form')
  await act(async () => {
    form.requestSubmit()
    form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }))
  })
  assert.equal(networkCalls, 1, 'Rapid same-tick duplicates are blocked')
  assert.ok(document.querySelector('fieldset').disabled)
  assert.equal(form.getAttribute('aria-busy'), 'true')
  assert.ok(document.querySelector('[role="status"]').textContent.includes('Sending'))
  assert.equal(document.querySelector('.form-success'), null)
  assert.equal(input('name').value, values.name, 'No premature reset')
  assert.equal(submission.url, 'https://formspree.io/f/xzedqjpr')
  assert.equal(form.getAttribute('action'), submission.url)
  assert.equal(form.getAttribute('method'), 'POST')
  assert.deepEqual(submission.options.headers, { Accept: 'application/json' }, 'No credentials or Resend headers are sent')
  assert.equal(submission.options.body.has('organization'), false)
  assert.equal(submission.options.body.get('_gotcha'), '')
  assert.equal(submission.options.method, 'POST')
  for (const [key, value] of Object.entries(values)) assert.equal(submission.options.body.get(key), value)
  assert.equal(submission.options.body.has('service'), false)
  await act(async () => finishRequest({ ok: true, headers: { get: () => 'application/json' }, json: async () => ({ ok: true }) }))
  assert.ok(document.querySelector('.form-success'))
  assert.equal(form.getAttribute('aria-busy'), 'false')
  for (const key of Object.keys(values)) assert.equal(input(key).value, '', 'Reset only after backend success')
  await act(async () => root.unmount())

  globalThis.fetch = async () => ({ ok: false })
  await mountContact('https://formspree.io/f/xzedqjpr')
  fill()
  await send()
  assert.ok(document.querySelector('.form-error[role="alert"]'))
  for (const [key, value] of Object.entries(values)) assert.equal(input(key).value, value, 'HTTP failure retains ' + key)
  assert.equal(document.querySelector('.form-success'), null)
  assert.equal(document.querySelector('fieldset').disabled, false, 'Retry is enabled')
  globalThis.fetch = async () => ({ ok: true, headers: { get: () => 'application/json' }, json: async () => ({ errors: ['Provider rejected this request'] }) })
  await send()
  assert.ok(document.querySelector('.form-error'), 'JSON rejection is not a false success')
  globalThis.fetch = async () => { throw new Error('Network unavailable') }
  await send()
  assert.ok(document.querySelector('.form-error'))
  for (const [key, value] of Object.entries(values)) assert.equal(input(key).value, value, 'Network failure retains ' + key)
  globalThis.fetch = async () => { throw new DOMException('Request timed out', 'TimeoutError') }
  await send()
  assert.ok(document.querySelector('.form-error'))
  assert.equal(input('message').value, values.message)
  globalThis.fetch = async () => ({ ok: true, headers: { get: () => 'application/json' }, json: async () => ({ ok: true }) })
  await send()
  assert.ok(document.querySelector('.form-success'), 'Retry can succeed')
  assert.equal(input('message').value, '')
  await act(async () => root.unmount())
  console.log('PASS mocked backend: six-field payload, pending status, duplicate prevention, confirmed-success reset, HTTP/JSON/network/timeout errors, retained input and successful retry')

  // Omit the endpoint prop to verify the actual configured/default integration.
  const formspreeRequests = []
  globalThis.fetch = async (url, options) => {
    formspreeRequests.push({ url, options })
    return { ok: true, headers: { get: () => 'text/html' } }
  }
  await mountContact(undefined)
  fill({ phone: '', company: '' })
  await send()
  assert.equal(formspreeRequests[0].url, 'https://formspree.io/f/xzedqjpr')
  assert.equal(formspreeRequests[0].options.body.get('company'), '')
  assert.ok(document.querySelector('.form-error'), 'HTML response must not claim success')
  assert.equal(input('message').value, values.message)
  for (const result of [{}, { ok: false }, { ok: true, errors: ['Rejected'] }, { ok: true, error: 'Rejected' }]) {
    globalThis.fetch = async () => ({ ok: true, headers: { get: () => 'application/json' }, json: async () => result })
    await send()
    assert.ok(document.querySelector('.form-error'))
    assert.equal(document.querySelector('.form-success'), null)
    assert.equal(input('message').value, values.message)
  }
  globalThis.fetch = async () => ({ ok: true, headers: { get: () => 'application/json' }, json: async () => { throw new SyntaxError('Invalid JSON') } })
  await send()
  assert.ok(document.querySelector('.form-error'))
  globalThis.fetch = async () => ({ ok: true, headers: { get: () => 'application/json' }, json: async () => ({ ok: true, next: '/thanks' }) })
  await send()
  assert.ok(document.querySelector('.form-success'))
  assert.equal(input('message').value, '')
  await act(async () => root.unmount())
  console.log('PASS Formspree contract: exact configured endpoint, optional company/phone, JSON confirmation, malformed/error responses and retry')

  window.history.replaceState({}, '', '/contact?service=training%2Fai')
  const host = document.getElementById('root')
  host.innerHTML = rendered.get('/contact')
  const hydrationErrors = []
  await act(async () => {
    root = hydrateRoot(host, createElement(App, { initialPath: '/contact' }), { onRecoverableError: error => hydrationErrors.push(error.message) })
  })
  assert.deepEqual(hydrationErrors, [])
  assert.equal(input('subject').value, 'Enquiry: AI Training')
  assert.equal(document.querySelector('main select'), null)
  await act(async () => root.unmount())
  assert.deepEqual(domErrors, [], 'No unhandled simulated-browser exceptions')
  dom.window.close()
  console.log('PASS prerender hydration: editable subject prefill without mismatch or service selector')
} finally {
  await server.close()
}
