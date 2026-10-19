import assert from 'node:assert/strict'
import { readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { preview } from 'vite'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = path.join(root, 'dist')
async function htmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(entries.map(entry => entry.isDirectory()
    ? htmlFiles(path.join(directory, entry.name))
    : entry.name.endsWith('.html') ? [path.join(directory, entry.name)] : []))
  return files.flat()
}
const documents = await htmlFiles(output)
assert.equal(documents.length, 21, '20 public pages and the not-found document are built')
const localAssets = new Set()
const paths = []
for (const filename of documents) {
  const html = await readFile(filename, 'utf8')
  const relative = path.relative(output, filename).replaceAll(path.sep, '/')
  const pathname = relative === 'index.html' ? '/' : '/' + relative.replace(/\/index\.html$/, '')
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1, relative + ': one primary heading')
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1]
  assert.equal(title, 'Entrolix', relative + ': consistent browser title')
  assert.match(html, /<meta property="og:title" content="Entrolix"/, relative + ': consistent social title')
  assert.match(html, /<noscript>.*?Navigation without JavaScript/s, relative + ': navigation fallback')
  assert.ok(html.includes('id="main-content"'), relative + ': skip-link destination')
  for (const match of html.matchAll(/<(?:img|script|link)\b[^>]*\b(?:src|href)="(\/[^"?#]+)[^"]*"/g)) localAssets.add(match[1])
  if (relative === '404.html') {
    assert.ok(html.includes('content="noindex,follow"'), 'Missing pages are not indexed')
  } else paths.push(pathname)
  if (pathname === '/contact') {
    assert.match(html, /<fieldset disabled=""/, 'Static form cannot submit before its handler is ready')
    assert.match(html, /<noscript>.*?mailto:info@entrolix\.com/s, 'Contact has a direct-email fallback')
  }
}
for (const asset of localAssets) {
  const info = await stat(path.join(output, asset.slice(1)))
  assert.ok(info.isFile() && info.size > 0, 'Built asset exists: ' + asset)
}
console.log(`PASS built HTML: ${documents.length} documents, one primary heading and Entrolix title per page, no-JavaScript fallbacks, ${localAssets.size} local assets`)

const server = await preview({ root, configLoader: 'runner', preview: { host: '127.0.0.1', port: 0, open: false } })
const origin = `http://127.0.0.1:${server.httpServer.address().port}`
try {
  for (const pathname of paths) {
    const response = await fetch(origin + pathname)
    assert.equal(response.status, 200, pathname + ': HTTP 200')
    const html = await response.text()
    assert.ok(html.includes(`data-page="${pathname}"`), pathname + ': correct prerendered page, not the homepage fallback')
  }
  for (const pathname of ['/training/ai/', '/consulting/crm/', '/contact?service=training%2Fai']) {
    const response = await fetch(origin + pathname)
    assert.equal(response.status, 200, pathname)
    assert.ok((await response.text()).includes(`data-page="${pathname.split('?')[0].replace(/\/$/, '')}"`), pathname + ': correct nested page')
  }
  for (const asset of localAssets) {
    const response = await fetch(origin + asset)
    assert.equal(response.status, 200, asset)
    assert.ok(!response.headers.get('content-type')?.includes('text/html'), asset + ': asset is not an HTML fallback')
    await response.arrayBuffer()
  }
  for (const pathname of ['/not-a-real-page', '/training/not-a-real-course', '/assets/missing-file.js']) {
    const response = await fetch(origin + pathname)
    assert.equal(response.status, 404, pathname + ': HTTP 404')
    await response.text()
  }
  console.log(`PASS preview HTTP: ${paths.length} routes, nested/trailing-slash URLs, enquiry query, asset content types, real 404s`)
} finally {
  await new Promise((resolve, reject) => {
    server.httpServer.close(error => error ? reject(error) : resolve())
    server.httpServer.closeAllConnections()
  })
}
