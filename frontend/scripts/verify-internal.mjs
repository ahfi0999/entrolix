import assert from 'node:assert/strict'
import { readFile, readdir, stat } from 'node:fs/promises'
import { JSDOM } from 'jsdom'
import { categoryPresentation, offeringPresentation } from '../src/internal-content.js'

const root = new URL('../', import.meta.url)
const credits = JSON.parse(await readFile(new URL('public/images/internal/credits.json', root), 'utf8'))
const files = (await readdir(new URL('dist/', root), { recursive: true })).filter(file => file.endsWith('.html'))
assert.equal(files.length, 21, 'All 20 routes plus the existing 404')
const journeys = new Set()
const usedPhotos = new Set()
let count = 0
for (const file of files) {
  const dom = new JSDOM(await readFile(new URL('dist/' + file.replaceAll('\\', '/'), root), 'utf8'))
  const document = dom.window.document
  const main = document.querySelector('main.internal-page')
  if (!main) { dom.window.close(); continue }
  count++
  assert.equal(main.querySelectorAll('h1').length, 1, file + ': one h1')
  assert.ok(main.querySelector('.breadcrumbs'), file + ': breadcrumbs')
  const photos = [...main.querySelectorAll('.internal-photo img')]
  if (main.classList.contains('contact-page')) {
    assert.equal(photos.length, 0, 'Minimal contact page focuses on the enquiry')
    assert.equal(main.querySelectorAll('form [required]').length, 4, 'Four essential fields')
    assert.deepEqual([...main.querySelectorAll('fieldset input, fieldset textarea')].map(field => field.name), ['name', 'email', 'phone', 'company', 'subject', 'message'])
    assert.equal(main.querySelector('select'), null, 'No service selector')
    assert.equal(main.querySelector('[name="phone"]').required, false)
    assert.equal(main.querySelector('[name="company"]').required, false)
    assert.equal(main.querySelector('h1').textContent, "Let's start a conversation.")
    assert.ok(main.querySelector('.contact-direct a[href="mailto:info@entrolix.com"]'))
  } else assert.ok(photos.length, file + ': relevant photography')
  for (const photo of photos) {
    const name = photo.getAttribute('src').match(/\/([^/]+)-1200\.webp$/)?.[1]
    assert.ok(credits.photos[name], file + ': documented photo source')
    usedPhotos.add(name)
    assert.equal(photo.getAttribute('alt'), credits.photos[name].alt)
    assert.equal(photo.getAttribute('width'), '1200')
    assert.equal(photo.getAttribute('height'), '900')
    assert.ok(photo.getAttribute('srcset').includes('600w') && photo.getAttribute('srcset').includes('1200w'))
    assert.ok(photo.getAttribute('sizes').includes('800px'))
    assert.ok(photo.closest('figure').textContent.includes('Illustrative photograph'), 'Never presented as a company photograph')
    assert.equal(photo.getAttribute('loading'), main.classList.contains('contact-page') ? 'lazy' : 'eager')
    if (photo.getAttribute('loading') === 'eager') assert.equal(photo.getAttribute('fetchpriority'), 'high')
  }
  if (main.classList.contains('offering-page')) {
    const key = file.replaceAll('\\', '/').replace('/index.html', '')
    const presentation = offeringPresentation[key]
    assert.ok(presentation, key + ': route-specific presentation')
    assert.equal(main.querySelector('.detail-section h2').textContent, presentation.overview)
    const journey = main.querySelector('.topic-journey')
    assert.equal(journey.querySelectorAll('ol > li').length, 3)
    assert.equal(journey.querySelector('h3').textContent, presentation.heading)
    journeys.add(journey.textContent)
    const enquiry = new URL(main.querySelector('.service-hero .button').href, 'http://entrolix.test')
    assert.equal(enquiry.pathname, '/contact')
    assert.equal(enquiry.searchParams.get('service'), key)
  }
  if (main.classList.contains('category-page')) {
    const group = file.replaceAll('\\', '/').split('/')[0]
    assert.equal(main.querySelector('.service-capabilities h2').textContent, categoryPresentation[group].introduction)
  }
  assert.equal(main.querySelectorAll('[data-tilt], .manifesto-orbit').length, 0, 'Restrained internal-page motion')
  assert.ok(document.querySelector('header.reference-header') && document.querySelector('footer.site-footer'))
  dom.window.close()
}
assert.equal(count, 19, 'Every internal route upgraded; homepage excluded')
assert.equal(journeys.size, 13, 'Every offering has a distinct explanatory workflow')
assert.equal(usedPhotos.size, 7, 'Every downloaded photograph is actually used')

let total = 0
for (const name of usedPhotos) {
  for (const width of [600, 1200]) {
    const asset = new URL(`public/images/internal/${name}-${width}.webp`, root)
    const buffer = await readFile(asset)
    assert.equal(buffer.toString('ascii', 0, 4), 'RIFF')
    assert.equal(buffer.toString('ascii', 8, 12), 'WEBP')
    // The source CDN supplies lossy VP8 renditions with an explicit frame header.
    const frame = buffer.indexOf(Buffer.from([0x9d, 0x01, 0x2a]))
    assert.ok(frame > 0, 'Valid WebP frame: ' + name)
    assert.equal(buffer.readUInt16LE(frame + 3) & 0x3fff, width)
    assert.equal(buffer.readUInt16LE(frame + 5) & 0x3fff, width * .75)
    assert.ok(buffer.length < 210000, 'Individual image budget: ' + name)
    assert.equal((await stat(new URL(`dist/images/internal/${name}-${width}.webp`, root))).size, buffer.length)
    total += buffer.length
  }
}
const css = await readFile(new URL('src/pages/internal-pages.css', root), 'utf8')
const dom = new JSDOM('<style></style>')
dom.window.document.querySelector('style').textContent = css
let rules = 0
function walk(list) {
  for (const rule of list) {
    if (rule.selectorText) {
      const selectors = rule.selectorText.replace(/:is\([^)]*\)/g, ':is-placeholder').split(',')
      for (const selector of selectors) assert.match(selector.trim(), /^\.internal-page(?:[ .:]|$)/, 'No styles escape the internal main: ' + selector)
      rules++
    }
    if (rule.cssRules) walk(rule.cssRules)
  }
}
walk(dom.window.document.styleSheets[0].cssRules)
for (const width of [600, 800, 1040]) assert.ok(css.includes(`@media (max-width: ${width}px)`))
assert.ok(css.includes('(prefers-reduced-motion: reduce)'))
assert.ok(css.includes(':focus-visible') && css.includes('font-size: 16px'))
assert.ok(!css.includes('animation:') && !css.includes('opacity: 0'), 'No perpetual animation or CSS-hidden content')
const luminance = color => color.match(/../g).map(v => parseInt(v, 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, v, index) => sum + v * [.2126, .7152, .0722][index], 0)
for (const [a, b] of [['596579', 'f6f5f1'], ['425bb0', 'f6f5f1'], ['b7c3d4', '07111e'], ['afc2ef', '0e1c2e'], ['ffffff', '315fce'], ['ffffff', '7044c8'], ['a12b35', 'fcfcfd'], ['ffffff', '3557be'], ['647186', 'ffffff']]) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  assert.ok((light + .05) / (dark + .05) >= 4.5, 'Text contrast: ' + a + ' / ' + b)
}
dom.window.close()
console.log(`PASS internal pages: ${count} routes, 13 unique workflows, 7 sourced photographs / 14 valid responsive WebPs (${Math.round(total / 1024)} KiB total), enquiry destinations, semantics, ${rules} isolated CSS rules, responsive rules and text contrast.`)
console.log('These are build, DOM, asset and CSS checks, not visual viewport or live email-delivery tests.')
