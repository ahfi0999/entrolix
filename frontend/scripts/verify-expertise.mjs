import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import { JSDOM } from 'jsdom'

// Run after build: tests the actual prerendered homepage, not a second component copy.
const root = new URL('../', import.meta.url)
const html = await readFile(new URL('dist/index.html', root), 'utf8')
const css = await readFile(new URL('src/pages/home-expertise.css', root), 'utf8')
const dom = new JSDOM(html)
const { document } = dom.window
const section = document.querySelector('.entrolix-expertise')
assert.ok(section, 'Expertise section is prerendered')
assert.equal(document.querySelector('.entrolix-hero').nextElementSibling, section, 'Immediately follows the unchanged hero')
assert.equal(section.id, 'services', 'Existing services anchor is preserved')
assert.equal(document.querySelectorAll('#services').length, 1)
assert.equal(section.getAttribute('aria-labelledby'), 'expertise-title')
assert.equal(section.querySelector('h2').textContent, 'Three capabilities.One partner.')
assert.equal(section.querySelectorAll('h1').length, 0)
assert.equal(section.querySelectorAll('.entrolix-expertise__grid h3').length, 3)
assert.equal(section.querySelectorAll('.entrolix-directory').length, 0, 'Removed service directory stays absent')
assert.equal(document.querySelectorAll('h1').length, 1)

const expected = [
  ['/training', 'Training Services', 'Explore Training'],
  ['/consulting', 'IT Solutions', 'Explore IT Solutions'],
  ['/recruitment', 'Recruitment', 'Explore Recruitment'],
]
const blocks = [...section.querySelectorAll('article')]
assert.equal(blocks.length, expected.length)
let images = 0
for (const [index, block] of blocks.entries()) {
  const [href, heading, label] = expected[index]
  const link = block.querySelector('a')
  assert.equal(block.querySelectorAll('a').length, 1, 'One clear keyboard stop per service')
  assert.equal(link.getAttribute('href'), href)
  assert.equal(link.textContent, label)
  assert.equal(block.querySelector('h3').textContent, heading)
  assert.equal(block.getAttribute('aria-labelledby'), block.querySelector('h3').id)
  assert.ok(block.hasAttribute('data-reveal'), 'Uses existing progressive motion system')
  const destination = await readFile(new URL('dist' + href + '/index.html', root), 'utf8')
  assert.ok(destination.includes('class="service-hero"'), 'Destination is a built service page')
  const image = block.querySelector('img')
  assert.ok(image.alt.length > 30)
  assert.equal(image.loading || image.getAttribute('loading'), 'lazy')
  assert.equal(image.getAttribute('decoding'), 'async')
  assert.ok(Number(image.width) > 0 && Number(image.height) > 0, 'Intrinsic image dimensions')
  assert.ok(image.getAttribute('sizes').includes('max-width: 600px'))
  for (const candidate of image.getAttribute('srcset').split(',')) {
    const [source, descriptor] = candidate.trim().split(/\s+/)
    assert.match(descriptor, /^\d+w$/)
    assert.ok((await stat(new URL('dist' + source, root))).size > 0, 'Responsive image asset exists')
    images++
  }
}
console.log('PASS expertise: placement, services anchor, heading hierarchy, 3 CTA destinations, alt text and ' + images + ' responsive image sources')

const style = document.createElement('style')
style.textContent = css
document.head.append(style)
assert.ok(style.sheet?.cssRules.length, 'CSS parses')
let ruleCount = 0
const walk = rules => {
  for (const rule of rules) {
    if (rule.selectorText) {
      for (const selector of rule.selectorText.split(',')) {
        const trimmed = selector.trim()
        assert.ok(trimmed === '.entrolix-expertise' || trimmed.startsWith('.entrolix-expertise '), 'Section-scoped selector: ' + trimmed)
      }
      ruleCount++
    }
    if (rule.cssRules) walk(rule.cssRules)
  }
}
walk(style.sheet.cssRules)
assert.ok(css.includes('@media (max-width: 1040px)') && css.includes('@media (max-width: 600px)'), 'Tablet and mobile layouts')
assert.ok(css.includes('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)'), 'Hover motion is desktop-only and preference-aware')
assert.ok(css.includes('@media (prefers-reduced-motion: reduce)'))
assert.ok(css.includes(':focus-visible') && css.includes('min-height: 48px'))
assert.ok(css.includes('aspect-ratio: 4 / 3'), 'Image geometry is reserved before loading')
const heroCss = await readFile(new URL('src/pages/home-hero.css', root), 'utf8')
const background = css.match(/--expertise-background:\s*(#[a-f0-9]{6})/)[1]
assert.ok(heroCss.includes('--hero-navy: ' + background), 'Seamless hero-to-section background')
const luminance = color => color.replace('#', '').match(/../g).map(x => parseInt(x, 16) / 255).map(x => x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4).reduce((sum, x, i) => sum + x * [.2126, .7152, .0722][i], 0)
for (const foreground of ['#f4f3ef', '#b4bdc9', '#a1bcf0', '#aebbd0', '#aab6c8', '#a4a9d5', '#dce7ff']) {
  assert.ok((luminance(foreground) + .05) / (luminance(background) + .05) >= 4.5, 'Text contrast for ' + foreground)
}
console.log('PASS expertise CSS: ' + ruleCount + ' isolated rules, responsive/reduced-motion rules, 48px links, reserved image geometry and text contrast >= 4.5:1')
dom.window.close()
