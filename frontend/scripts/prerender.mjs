import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { createServer } from 'vite'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = path.join(root, 'dist')
const server = await createServer({ root, configLoader: 'runner', mode: 'production', appType: 'custom', server: { middlewareMode: true, watch: null, ws: false }, optimizeDeps: { noDiscovery: true, include: [] } })
const escape = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
try {
  const { default: App } = await server.ssrLoadModule('/src/App.jsx')
  const { pagePaths, resolveRoute } = await server.ssrLoadModule('/src/routes.js')
  const template = await fs.readFile(path.join(output, 'index.html'), 'utf8')
  if (!template.includes('<div id="root"></div>')) throw new Error('Expected an empty Vite root before prerendering. Run the full build command.')
  for (const pathname of [...pagePaths, '/404']) {
    const route = resolveRoute(pathname)
    const body = renderToString(createElement(App, { initialPath: pathname }))
    const html = template
      .replace(/<title>.*?<\/title>/, () => `<title>${escape(route.title)}</title>`)
      .replace(/(<meta name="description" content=")[^"]*("\s*\/?>)/, (_, start, end) => start + escape(route.description) + end)
      .replace(/(<meta property="og:title" content=")[^"]*("\s*\/?>)/, (_, start, end) => start + escape(route.title) + end)
      .replace(/(<meta property="og:description" content=")[^"]*("\s*\/?>)/, (_, start, end) => start + escape(route.description) + end)
      .replace('content="index,follow"', route.type === 'not-found' ? 'content="noindex,follow"' : 'content="index,follow"')
      .replace('<div id="root"></div>', () => `<div id="root" data-page="${pathname}">${body}</div>`)
    const target = pathname === '/404' ? path.join(output, '404.html') : path.join(output, pathname.slice(1), 'index.html')
    await fs.mkdir(path.dirname(target), { recursive: true })
    await fs.writeFile(target, html)
  }
  console.log(`Prerendered ${pagePaths.length} pages plus a 404 page with the Entrolix title and page-specific descriptions.`)
} finally {
  await server.close()
}
