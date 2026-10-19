import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { JSDOM } from 'jsdom'

// Verify the production HTML so the section also works before hydration.
const root = new URL('../', import.meta.url)
const html = await readFile(new URL('dist/index.html', root), 'utf8')
const css = await readFile(new URL('src/pages/home-why.css', root), 'utf8')
const dom = new JSDOM(html)
const { document } = dom.window
const section = document.querySelector('.entrolix-why')
assert.ok(section, 'Why Entrolix is prerendered')
assert.equal(section.id, 'why-entrolix')
assert.equal(document.querySelectorAll('#why-entrolix').length, 1)
assert.equal(section.previousElementSibling, document.querySelector('.entrolix-expertise'), 'Placed directly after Our Expertise')
assert.equal(section.nextElementSibling.id, 'process', 'Existing process section remains below it')
assert.equal(document.querySelectorAll('.entrolix-hero').length, 1)
assert.equal(document.querySelectorAll('.entrolix-expertise').length, 1)
assert.equal(document.querySelector('#about.home-about'), null, 'Removed About preview stays absent')
assert.equal(document.querySelector('.home-page .contact-banner'), null, 'Removed homepage contact banner stays absent')
assert.equal(document.querySelectorAll('h1').length, 1)
assert.equal(section.querySelectorAll('h2').length, 1)
assert.equal(section.getAttribute('aria-labelledby'), section.querySelector('h2').id)
assert.equal(section.querySelector('h2').textContent.replace(/\s+/g, ' ').trim(), 'The right skills. The right solutions. The right connections.')
assert.equal(section.querySelectorAll('h3').length, 3)
assert.equal(section.querySelectorAll('img').length, 0, 'Typography-first section adds no image downloads')
const principles = [...section.querySelectorAll('ol > li')]
assert.deepEqual(principles.map(item => item.querySelector('h3').textContent), ['Practical Learning', 'Thoughtful Technology', 'Meaningful Connections'])
assert.deepEqual(principles.map(item => item.querySelector('.entrolix-why__number').textContent), ['01', '02', '03'])
for (const principle of principles) {
  assert.ok(principle.hasAttribute('data-reveal'), 'Reuses existing reveal behavior')
  assert.ok(principle.querySelector('p').textContent.length > 60)
  assert.equal(principle.querySelector('.entrolix-why__number').getAttribute('aria-hidden'), 'true')
}
const links = section.querySelectorAll('a')
assert.equal(links.length, 1)
assert.equal(links[0].textContent, 'Discover Our Approach')
assert.equal(links[0].getAttribute('href'), '/about')
assert.equal(links[0].querySelector('svg').getAttribute('aria-hidden'), 'true')
const about = await readFile(new URL('dist/about/index.html', root), 'utf8')
assert.ok(about.includes('company-story') && about.includes('company-beliefs'), 'CTA points to an existing relevant company page')
console.log('PASS Why Entrolix: exact placement, removed closing sections, semantic headings, three principles, readable prerendered content and valid About CTA')

const style = document.createElement('style')
style.textContent = css
document.head.append(style)
assert.ok(style.sheet?.cssRules.length, 'Section CSS parses')
let ruleCount = 0
const walk = rules => {
  for (const rule of rules) {
    if (rule.selectorText) {
      for (const selector of rule.selectorText.split(',')) {
        const scoped = selector.trim()
        assert.ok(scoped === '.entrolix-why' || scoped.startsWith('.entrolix-why '), 'Local selector: ' + scoped)
      }
      ruleCount++
    }
    if (rule.cssRules) walk(rule.cssRules)
  }
}
walk(style.sheet.cssRules)
assert.ok(css.includes('@media (max-width: 1040px)'))
assert.ok(css.includes('@media (max-width: 800px)'))
assert.ok(css.includes('@media (max-width: 600px)'))
assert.ok(css.includes('grid-template-columns: minmax(0, 1fr)'), 'Single-column small-screen layout')
assert.ok(css.includes('min-width: 0'), 'Grid children can shrink')
assert.ok(css.includes('min-height: 48px') && css.includes(':focus-visible'), 'Comfortable keyboard-accessible CTA')
assert.ok(css.includes('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)'))
assert.ok(css.includes('@media (prefers-reduced-motion: reduce)'))
assert.ok(!css.includes('animation:') && !css.includes('opacity: 0'), 'No always-hidden content or repeating animation')
const background = css.match(/--why-background:\s*(#[a-f0-9]{6})/)[1]
const expertiseCss = await readFile(new URL('src/pages/home-expertise.css', root), 'utf8')
assert.ok(expertiseCss.includes('--expertise-background: ' + background), 'Background continues from Our Expertise')
const luminance = color => color.replace('#', '').match(/../g).map(x => parseInt(x, 16) / 255).map(x => x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4).reduce((sum, x, i) => sum + x * [.2126, .7152, .0722][i], 0)
for (const foreground of ['#f4f3ef', '#b4bdc9', '#afc2ef', '#a4a9d5', '#dce7ff']) {
  assert.ok((luminance(foreground) + .05) / (luminance(background) + .05) >= 4.5, 'Text contrast: ' + foreground)
}
console.log('PASS Why Entrolix CSS: ' + ruleCount + ' scoped rules, tablet/mobile layouts, reduced-motion and focus rules, 48px CTA and text contrast >= 4.5:1')
dom.window.close()
