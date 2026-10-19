import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import { createEnquiryHandler } from './server/enquiry.mjs'

function enquiryApi() {
  let env
  const mount = server => {
    const handle = createEnquiryHandler({ env, local: true })
    server.middlewares.use((request, response, next) => {
      if (request.url?.split('?')[0] !== '/api/enquiry') return next()
      void handle(request, response)
    })
  }
  return {
    name: 'server-only-enquiry-api',
    configResolved(config) {
      // loadEnv with no prefix is used only here, never injected via define.
      const values = { ...loadEnv(config.mode, config.envDir, ''), ...process.env }
      env = Object.fromEntries(['RESEND_API_KEY', 'RESEND_FROM', 'ENQUIRY_TO', 'SITE_ORIGIN'].map(key => [key, values[key]]))
    },
    configureServer: mount,
    configurePreviewServer: mount,
  }
}

export default defineConfig({
  // Resolve against this file, not the shell's working directory.
  cacheDir: fileURLToPath(new URL('./.cache/vite/', import.meta.url)),
  plugins: [enquiryApi(), {
    name: 'prerendered-preview-routes',
    // Match the production host's directory-index behavior for clean URLs.
    configurePreviewServer(server) {
      const output = path.resolve(server.config.root, server.config.build.outDir)
      server.middlewares.use((request, response, next) => {
        if (!['GET', 'HEAD'].includes(request.method)) return next()
        const url = new URL(request.url, 'http://localhost')
        let pathname
        try { pathname = decodeURIComponent(url.pathname).replace(/\/+$/, '') }
        catch { response.statusCode = 400; response.end('Invalid URL'); return }
        const requested = path.resolve(output, `.${pathname || '/'}`)
        if (requested !== output && !requested.startsWith(output + path.sep)) {
          response.statusCode = 400
          response.end('Invalid path')
          return
        }
        // Existing assets use Vite's static handler; missing assets must not
        // fall through to its SPA homepage fallback with a misleading HTTP 200.
        if (statSync(requested, { throwIfNoEntry: false })?.isFile()) return next()
        const entry = path.join(requested, 'index.html')
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
