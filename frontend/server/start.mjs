import { createServer } from 'node:http'
import { createEnquiryHandler } from './enquiry.mjs'

// Production API only. Put it behind your HTTPS reverse proxy at /api/enquiry.
// Inject secrets at runtime, not during the frontend/Docker build.
for (const name of ['RESEND_API_KEY', 'RESEND_FROM', 'ENQUIRY_TO', 'SITE_ORIGIN']) {
  if (!process.env[name]?.trim()) throw new Error(`Missing server environment variable: ${name}`)
}
const siteOrigin = new URL(process.env.SITE_ORIGIN)
if (siteOrigin.protocol !== 'https:' || siteOrigin.origin !== process.env.SITE_ORIGIN.replace(/\/$/, '')) throw new Error('SITE_ORIGIN must be your exact HTTPS website origin')
const handle = createEnquiryHandler()
const server = createServer((req, res) => {
  if (req.url?.split('?')[0] === '/api/enquiry') return void handle(req, res)
  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end('{"ok":false,"error":"Not found"}')
})
server.requestTimeout = 20000
server.headersTimeout = 10000
server.listen(Number(process.env.ENQUIRY_PORT || 3001), process.env.ENQUIRY_HOST || '127.0.0.1', () => console.log('Enquiry API ready.'))
