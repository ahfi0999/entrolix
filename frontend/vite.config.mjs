import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [{
    name: 'prerendered-preview-routes',
    // Match the production host's directory-index behavior for clean URLs.
    configurePreviewServer(server) {
      const output = path.resolve(server.config.root, server.config.build.outDir)
      server.middlewares.use((request, response, next) => {
        if (!['GET', 'HEAD'].includes(request.method)) return next()
        const url = new URL(request.url, 'http://localhost')
        // Only named page paths enter this middleware; assets use Vite's handler.
        if (!/^\/(?:[a-z0-9-]+\/?)*$/i.test(url.pathname)) return next()
        const pathname = url.pathname.replace(/\/+$/, '')
        const entry = path.join(output, pathname.slice(1), 'index.html')
        if (existsSync(entry)) {
          request.url = `${pathname}/index.html${url.search}`
          return next()
        }
        const notFound = path.join(output, '404.html')
        if (!existsSync(notFound)) return next()
        response.statusCode = 404
        response.setHeader('Content-Type', 'text/html; charset=utf-8')
        response.setHeader('Cache-Control', 'no-cache')
        response.end(request.method === 'HEAD' ? undefined : readFileSync(notFound))
      })
    },
  }],
})
