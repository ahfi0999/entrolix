import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { readFile } from 'node:fs/promises'
import { createElement, act } from 'react'
import { renderToString } from 'react-dom/server'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { createServer } from 'vite'

const server = await createServer({
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
  const titles = new Set()
  let checkedLinks = 0
  for (const [pathname, html] of rendered) {
    const route = resolveRoute(pathname)
    assert.equal((html.match(/<main[ >]/g) || []).length, 1, pathname + ': one main landmark')
    assert.equal((html.match(/<h1[ >]/g) || []).length, 1, pathname + ': one primary heading')
    assert.ok(!titles.has(route.title), pathname + ': unique title')
    titles.add(route.title)
    assert.equal(resolveRoute(pathname + '/').type, route.type, pathname + ': trailing slash')
    if (['services', 'category', 'offering'].includes(route.type)) {
      assert.ok(html.includes('class="service-hero"'), pathname + ': shared dark hero')
      assert.ok(html.includes('button button-lime'), pathname + ': lime hero CTA')
      assert.ok(html.includes('Where we can help.'), pathname + ': capability section')
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
  assert.ok(rendered.get('/consulting/rms').includes('recruitment management system'))
  console.log('PASS 20 pages: all 13 offerings, complete detail content, unique titles, trailing slashes, and ' + checkedLinks + ' internal links')

  const { JSDOM } = await import('jsdom')
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
    assert.equal(page.window.document.querySelector('header .nav-ctas'), null, pathname + ': no header CTA group')
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
  assert.ok(headerStyles.includes("font-family: 'Manrope', sans-serif"))
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
    const match = headerStyles.match(new RegExp('--nav-' + name + ':\\s*#([a-f0-9]{6})', 'i'))
    assert.ok(match, 'Header color token exists: ' + name)
    const channels = match[1].match(/../g)
    assert.equal(new Set(channels).size, 1, 'Header color is neutral grayscale: ' + name)
    return [name, match[1]]
  }))
  assert.ok(headerStyles.includes('.reading-progress span { background: #525252; }'), 'Header progress strip is neutral')
  assert.ok(headerStyles.includes('.dropdown-icon svg { width: 20px; height: 20px; fill: none; }'), 'Compact outline SVG styling')
  for (const [foreground, background] of [[navColors.text, 'ffffff'], [navColors.active, navColors.highlight], [navColors.muted, 'ffffff'], [navColors.muted, navColors.highlight], [navColors.muted, 'fafafa']]) {
    const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
    assert.ok((values[0] + .05) / (values[1] + .05) >= 4.5, 'Header text contrast: ' + foreground + ' on ' + background)
  }
  console.log('PASS header presentation: unique service-specific outline icons including nested applications, active-page semantics, logo label, neutral colors, Manrope, mobile/reduced-motion rules, and text contrast')
  const dom = new JSDOM('<!doctype html><html><head><title>Entrolix</title><meta name="description"><meta property="og:title"><meta property="og:description"><meta name="robots"></head><body><div id="root"></div></body></html>', { url: 'http://localhost/training' })
  globalThis.window = dom.window
  globalThis.document = dom.window.document
  globalThis.FormData = dom.window.FormData
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  dom.window.HTMLElement.prototype.scrollIntoView = function () {}
  let root = createRoot(document.getElementById('root'))
  await act(async () => root.render(createElement(App, { initialPath: '/training' })))
  assert.equal(document.title, 'Training | Entrolix')
  const toggle = document.querySelector('.menu-button')
  await act(async () => toggle.click())
  assert.equal(toggle.getAttribute('aria-expanded'), 'true')
  await act(async () => window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' })))
  assert.equal(toggle.getAttribute('aria-expanded'), 'false')
  assert.equal(document.activeElement, toggle)
  const navItems = [...document.querySelectorAll('.primary-links > a, .primary-links > .services-disclosure > button')]
  assert.deepEqual(navItems.map(item => item.textContent.trim()), ['Home', 'Training Services', 'IT Solutions', 'Recruitment'])
  assert.equal(document.querySelector('header .button'), null, 'Header contains navigation without CTA buttons')
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
  console.log('PASS navigation: four primary items without header CTAs, exactly two IT Solutions options, LMS/HRMS/RMS/CRM flyout, hover/click, keyboard focus, three-level mobile Escape, dismissals and FAQs')

  let networkCalls = 0
  globalThis.fetch = async () => { networkCalls++; throw new Error('Unexpected live network call') }
  window.history.replaceState({}, '', '/contact?service=consulting%2Frms')
  root = createRoot(document.getElementById('root'))
  await act(async () => root.render(createElement(ContactPage, { endpoint: '' })))
  assert.equal(document.querySelector('select').value, 'consulting/rms')
  const fill = () => {
    document.querySelector('[name="name"]').value = 'Casey Test'
    document.querySelector('[name="email"]').value = 'casey@example.com'
    document.querySelector('[name="organization"]').value = 'Test & Review'
    document.querySelector('[name="message"]').value = 'We need candidate tracking & interview feedback.'
  }
  fill()
  await act(async () => document.querySelector('form').requestSubmit())
  const draft = document.querySelector('.email-draft a')
  assert.ok(draft)
  const email = new URL(draft.href)
  assert.equal(email.pathname, 'info@entrolix.com')
  assert.equal(email.searchParams.get('subject'), 'Enquiry: Custom RMS Development')
  assert.ok(email.searchParams.get('body').includes('Test & Review'))
  assert.ok(document.querySelector('.email-draft').textContent.includes('Nothing has been sent yet'))
  assert.equal(networkCalls, 0)
  await act(async () => root.unmount())
  console.log('PASS email fallback: service prefill, encoded enquiry draft, no automatic send')

  let submission
  let finishRequest
  globalThis.fetch = (url, options) => {
    submission = { url, options }
    return new Promise(resolve => { finishRequest = resolve })
  }
  root = createRoot(document.getElementById('root'))
  await act(async () => root.render(createElement(ContactPage, { endpoint: 'https://formspree.io/f/test-only' })))
  fill()
  await act(async () => document.querySelector('form').requestSubmit())
  assert.ok(document.querySelector('fieldset').disabled)
  assert.equal(submission.options.method, 'POST')
  assert.equal(submission.options.body.get('service'), 'Custom RMS Development')
  assert.equal(submission.options.body.get('email'), 'casey@example.com')
  await act(async () => finishRequest({ ok: true }))
  assert.ok(document.querySelector('.form-success'))
  assert.equal(document.querySelector('[name="name"]').value, '')
  await act(async () => root.unmount())

  globalThis.fetch = async () => ({ ok: false })
  root = createRoot(document.getElementById('root'))
  await act(async () => root.render(createElement(ContactPage, { endpoint: 'https://formspree.io/f/test-only' })))
  fill()
  await act(async () => document.querySelector('form').requestSubmit())
  assert.ok(document.querySelector('[role="alert"]'))
  assert.equal(document.querySelector('[name="name"]').value, 'Casey Test')
  assert.ok(!document.querySelector('.form-success'))
  await act(async () => root.unmount())
  console.log('PASS form delivery with mocked responses: service payload, pending state, success reset, error retains input')

  window.history.replaceState({}, '', '/contact?service=training%2Fai')
  const host = document.getElementById('root')
  host.innerHTML = rendered.get('/contact')
  const hydrationErrors = []
  await act(async () => {
    root = hydrateRoot(host, createElement(App, { initialPath: '/contact' }), { onRecoverableError: error => hydrationErrors.push(error.message) })
  })
  assert.deepEqual(hydrationErrors, [])
  assert.equal(document.querySelector('select').value, 'training/ai')
  await act(async () => root.unmount())
  dom.window.close()
  console.log('PASS prerender hydration: contact page loads query-selected training without mismatch')
} finally {
  await server.close()
}
