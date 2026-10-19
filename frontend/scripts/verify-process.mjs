import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { JSDOM } from 'jsdom'

const root = new URL('../', import.meta.url)
const html = await readFile(new URL('dist/index.html', root), 'utf8')
const css = await readFile(new URL('src/pages/home-process.css', root), 'utf8')
const dom = new JSDOM(html)
const { document } = dom.window
const section = document.querySelector('.entrolix-process')
assert.ok(section, 'Process is present before JavaScript runs')
assert.equal(section.id, 'process', 'Existing process anchor retained')
assert.equal(document.querySelectorAll('#process').length, 1)
assert.equal(section.previousElementSibling, document.querySelector('.entrolix-why'))
assert.equal(section.nextElementSibling, null, 'Process is now the final homepage section')
assert.ok(document.querySelector('.site-footer'), 'Site footer remains after removing the closing sections')
assert.equal(document.querySelectorAll('.home-approach').length, 0, 'Replaces rather than duplicates the old process')
assert.equal(document.querySelectorAll('h1').length, 1)
assert.equal(section.querySelectorAll('h2').length, 1)
assert.equal(section.getAttribute('aria-labelledby'), section.querySelector('h2').id)
assert.equal(section.querySelector('h2').textContent, 'Good work startswith understanding.')
assert.equal(section.querySelector('.entrolix-process__eyebrow').textContent, 'OUR APPROACH')
assert.ok(section.querySelector('.entrolix-process__scope').textContent.includes('agreed scope'))
const steps = [...section.querySelectorAll('ol > li')]
assert.equal(steps.length, 4)
assert.deepEqual(steps.map(step => step.querySelector('h3').textContent), ['Understand', 'Plan', 'Deliver', 'Move Forward'])
assert.deepEqual(steps.map(step => step.querySelector('.entrolix-process__number').textContent), ['01', '02', '03', '04'])
assert.deepEqual(steps.map(step => Number(step.dataset.revealDelay)), [0, 60, 120, 180])
for (const step of steps) {
  assert.ok(step.hasAttribute('data-reveal'), 'Uses existing one-time, preference-aware reveals')
  assert.equal(step.querySelector('.entrolix-process__number').getAttribute('aria-hidden'), 'true')
  assert.ok(step.querySelector('p').textContent.length > 60)
}
assert.equal(section.querySelector('.entrolix-process__invitation h3').textContent, 'Have a requirement in mind?')
assert.equal(section.querySelector('.entrolix-process__invitation p').textContent, 'Let’s discuss what you’re looking to achieve.')
const links = section.querySelectorAll('a')
assert.equal(links.length, 1)
assert.equal(links[0].getAttribute('href'), '/contact')
assert.equal(links[0].textContent, 'Talk to Our Team')
assert.equal(links[0].querySelector('svg').getAttribute('aria-hidden'), 'true')
const contact = await readFile(new URL('dist/contact/index.html', root), 'utf8')
assert.ok(contact.includes('enquiry-form') && contact.includes('mailto:info@entrolix.com'), 'Existing contact form and email fallback destination')
console.log('PASS process: placement, existing anchor, four ordered steps, short stagger, headings, scoped copy and real contact CTA')

const style = document.createElement('style')
style.textContent = css
document.head.append(style)
assert.ok(style.sheet?.cssRules.length, 'Process CSS parses')
let ruleCount = 0
const walk = rules => {
  for (const rule of rules) {
    if (rule.selectorText) {
      for (const selector of rule.selectorText.split(',')) {
        const scoped = selector.trim()
        assert.ok(scoped === '.entrolix-process' || scoped.startsWith('.entrolix-process '), 'Section-scoped selector: ' + scoped)
      }
      ruleCount++
    }
    if (rule.cssRules) walk(rule.cssRules)
  }
}
walk(style.sheet.cssRules)
assert.ok(css.includes('repeat(4, minmax(0, 1fr))'), 'Desktop four-column journey')
assert.ok(css.includes('@media (max-width: 1040px)') && css.includes('repeat(2, minmax(0, 1fr))'), 'Tablet two-column layout')
assert.ok(css.includes('@media (max-width: 600px)') && css.includes('grid-template-columns: minmax(0, 1fr)'), 'Mobile stacked layout')
assert.ok(css.includes('.entrolix-process__step:not(:last-child)::before') && css.includes('bottom: -20px'), 'Mobile connector adapts to content height')
assert.ok(css.includes('.entrolix-process__step:last-child::before { display: none; }'), 'Journey ends at final step')
assert.ok(css.includes(':focus-visible') && css.includes('min-height: 52px'))
assert.ok(css.includes('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)'))
assert.ok(css.includes('@media (prefers-reduced-motion: reduce)'))
assert.ok(!css.includes('animation:') && !css.includes('opacity: 0'), 'Readable without animations; no loops')
const background = css.match(/--process-background:\s*(#[a-f0-9]{6})/)[1]
const whyCss = await readFile(new URL('src/pages/home-why.css', root), 'utf8')
assert.ok(whyCss.includes('--why-background: ' + background), 'Seamless background with preceding section')
const luminance = color => color.replace('#', '').match(/../g).map(x => parseInt(x, 16) / 255).map(x => x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4).reduce((sum, x, i) => sum + x * [.2126, .7152, .0722][i], 0)
for (const foreground of ['#f4f3ef', '#b4bdc9', '#afc2ef', '#a3afc1', '#a4a9d5', '#8ebdff', '#dce7ff']) {
  assert.ok((luminance(foreground) + .05) / (luminance(background) + .05) >= 4.5, 'Text contrast: ' + foreground)
}
console.log('PASS process CSS: ' + ruleCount + ' isolated rules, desktop/tablet/mobile layouts, connector rules, reduced-motion and focus rules, 52px CTA and text contrast >= 4.5:1')
dom.window.close()
