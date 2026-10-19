import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'
import { preview } from 'vite'

const root = new URL('../', import.meta.url)
const html = await readFile(new URL('dist/index.html', root), 'utf8')
const dom = new JSDOM(html)
const { document } = dom.window
assert.equal(document.querySelector('#service-directory'), null, 'Requested service directory is removed')
assert.equal(document.querySelector('.entrolix-directory'), null, 'No hidden directory remains')
assert.equal(document.querySelectorAll('.entrolix-expertise__grid article').length, 3, 'Image cards remain')
assert.equal(document.querySelector('.entrolix-expertise').nextElementSibling.id, 'why-entrolix', 'Sections stay adjacent')
console.log('PASS directory removal: no directory markup; image cards and following section preserved')

const groups = [
  ['Training', [
    ['ServiceNow', '/training/servicenow', 'ServiceNow Training'],
    ['Artificial Intelligence', '/training/ai', 'AI Training'],
    ['Data Science', '/training/data-science', 'Data Science Training'],
    ['Software Testing', '/training/testing', 'Software Testing Training'],
  ]],
  ['IT Consulting', [
    ['ServiceNow Implementation', '/consulting/servicenow-implementation', 'ServiceNow Implementation'],
    ['ServiceNow Support', '/consulting/servicenow-support', 'ServiceNow Support'],
    ['LMS Development', '/consulting/lms', 'Custom LMS Development'],
    ['HRMS Development', '/consulting/hrms', 'Custom HRMS Development'],
    ['RMS Development', '/consulting/rms', 'Custom RMS Development'],
    ['CRM Development', '/consulting/crm', 'Custom CRM Development'],
  ]],
  ['Recruitment', [
    ['Permanent Staffing', '/recruitment/permanent-staffing', 'Permanent Staffing'],
    ['Temporary Staffing', '/recruitment/temporary-staffing', 'Temporary Staffing'],
    ['IT Staffing', '/recruitment/it-staffing', 'IT Staffing'],
  ]],
]
// The existing navbar retains its category dropdowns; detailed routes are checked below.
const header = document.querySelector('.site-header')
for (const id of ['training', 'consulting', 'recruitment']) {
  assert.ok(header.querySelector(`#${id}-menu-trigger`), 'Navbar retains dropdown: ' + id)
}
console.log('PASS navigation: all three service category dropdowns remain available')

const server = await preview({ root: fileURLToPath(root), configLoader: 'runner', preview: { host: '127.0.0.1', port: 0, open: false } })
const origin = `http://127.0.0.1:${server.httpServer.address().port}`
try {
  for (const [label, href, heading] of groups.flatMap(([, links]) => links)) {
    const response = await fetch(origin + href)
    assert.equal(response.status, 200, label + ': HTTP 200')
    const page = new JSDOM(await response.text())
    assert.equal(page.window.document.querySelector('#root').getAttribute('data-page'), href, 'Correct prerendered route, not homepage fallback')
    assert.equal(page.window.document.querySelector('h1').textContent, heading, 'Intended service page')
    page.window.close()
    console.log('PASS HTTP 200 + intended heading: ' + label + ' -> ' + href)
  }
} finally {
  dom.window.close()
  await new Promise((resolve, reject) => {
    server.httpServer.close(error => error ? reject(error) : resolve())
    server.httpServer.closeAllConnections()
  })
}
