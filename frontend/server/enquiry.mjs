import { createHmac } from 'node:crypto'

const MAX_BYTES = 32 * 1024
const WINDOW_MS = 10 * 60 * 1000
const fields = { name: 100, email: 254, phone: 40, organization: 150, subject: 180, message: 4000 }
const required = ['name', 'email', 'subject', 'message']
const emailPattern = /^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function reply(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' })
  response.end(JSON.stringify(body))
}

// Shared by local Vite middleware and the standalone production API.
// Only the server reads these credentials; never import this module from src/.
export function createEnquiryHandler({ env = process.env, fetchImpl = fetch, local = false, now = Date.now, logger = console } = {}) {
  const attempts = new Map()
  let globalWindow = { start: now(), count: 0 }
  const origin = env.SITE_ORIGIN?.replace(/\/$/, '')
  const apiKey = env.RESEND_API_KEY?.trim()
  const from = env.RESEND_FROM?.trim()
  const to = env.ENQUIRY_TO?.trim()
  const senderAddress = from?.match(/<([^<>]+)>$/)?.[1] || from
  const configured = apiKey && senderAddress && emailPattern.test(senderAddress) && !/[\r\n]/.test(from) && to && emailPattern.test(to)

  return async (request, response) => {
    try {
      if (request.method !== 'POST') {
        response.setHeader('Allow', 'POST')
        return reply(response, 405, { ok: false, error: 'Use POST to submit an enquiry.' })
      }
      const requestOrigin = request.headers.origin
      // Explicit allow-list in production; local preview permits loopback only.
      const originAllowed = requestOrigin && (requestOrigin === origin || (local && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(requestOrigin)))
      if (!originAllowed || request.headers['sec-fetch-site'] === 'cross-site') {
        return reply(response, 403, { ok: false, error: 'Please submit the form from the Entrolix website.' })
      }
      if (!configured) return reply(response, 503, { ok: false, error: 'Email delivery is not configured. Please contact us by email.' })
      const time = now()
      for (const [ip, entry] of attempts) if (time - entry.start >= WINDOW_MS) attempts.delete(ip)
      // Do not trust user-supplied forwarding headers. Behind a reverse proxy,
      // this is intentionally a conservative shared limit; add edge rate limits.
      const ip = request.socket.remoteAddress || 'unknown'
      const entry = attempts.get(ip) || { start: time, count: 0 }
      if (time - globalWindow.start >= WINDOW_MS) globalWindow = { start: time, count: 0 }
      if (entry.count >= 5 || globalWindow.count >= 60 || (!attempts.has(ip) && attempts.size >= 1000)) {
        response.setHeader('Retry-After', '600')
        return reply(response, 429, { ok: false, error: 'Too many requests. Please wait a few minutes before trying again.' })
      }
      entry.count++
      globalWindow.count++
      attempts.set(ip, entry)
      const requestId = request.headers['x-enquiry-id']
      if (typeof requestId !== 'string' || !uuidPattern.test(requestId)) return reply(response, 400, { ok: false, error: 'Invalid enquiry reference. Please reload the form.' })
      const contentType = request.headers['content-type'] || ''
      if (!contentType.startsWith('multipart/form-data;')) return reply(response, 415, { ok: false, error: 'Unsupported form format.' })
      if (Number(request.headers['content-length']) > MAX_BYTES) return reply(response, 413, { ok: false, error: 'Enquiry is too large.' })
      const chunks = []
      let bytes = 0
      for await (const chunk of request) {
        bytes += chunk.length
        if (bytes > MAX_BYTES) return reply(response, 413, { ok: false, error: 'Enquiry is too large.' })
        chunks.push(chunk)
      }
      let data
      try {
        data = await new Request('http://localhost/api/enquiry', { method: 'POST', headers: { 'Content-Type': contentType }, body: Buffer.concat(chunks) }).formData()
      } catch { return reply(response, 400, { ok: false, error: 'Invalid form data.' }) }
      if (data.get('_gotcha')) return reply(response, 400, { ok: false, error: 'Unable to accept this enquiry.' })
      const values = {}
      for (const [name, limit] of Object.entries(fields)) {
        const value = data.get(name) ?? ''
        if (typeof value !== 'string' || data.getAll(name).length > 1 || value.length > limit) return reply(response, 400, { ok: false, error: 'Please check your form fields.' })
        values[name] = value.trim()
        if (name !== 'message' && /[\r\n\x00-\x1f\x7f]/.test(value)) return reply(response, 400, { ok: false, error: 'Please use a single line for contact details and subject.' })
      }
      if (required.some(name => !values[name]) || !emailPattern.test(values.email)) return reply(response, 400, { ok: false, error: 'Please provide your name, a valid email, subject and message.' })
      // Recipient and sender are fixed server configuration, never visitor input.
      const payload = {
        from, to: [to], reply_to: values.email,
        subject: `Website enquiry: ${values.subject}`,
        text: `New Entrolix website enquiry\n\nName: ${values.name}\nEmail: ${values.email}\nPhone: ${values.phone || 'Not provided'}\nCompany: ${values.organization || 'Not provided'}\nSubject: ${values.subject}\n\n${values.message}`,
      }
      // Retrying an unchanged enquiry reuses the provider idempotency key.
      // HMAC keeps the public identifier from exposing personal information.
      const idempotencyKey = createHmac('sha256', apiKey).update(requestId + JSON.stringify(payload)).digest('hex')
      let result
      let provider
      try {
        provider = await fetchImpl('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': `enquiry/${idempotencyKey}` },
          body: JSON.stringify(payload), signal: AbortSignal.timeout(15000),
        })
        result = await provider.json()
      } catch {
        logger.warn('Enquiry provider unavailable; delivery not confirmed.')
        return reply(response, 502, { ok: false, error: 'We could not confirm your enquiry. Please retry or contact us by email.' })
      }
      if (!provider.ok || typeof result?.id !== 'string' || !result.id || result.error) {
        // Do not log the response body: it can include addresses or submitted data.
        logger.warn(`Enquiry provider rejected request (HTTP ${provider.status}).`)
        return reply(response, 502, { ok: false, error: 'We could not send your enquiry. Please retry or contact us by email.' })
      }
      return reply(response, 200, { ok: true })
    } catch {
      logger.warn('Enquiry request failed; no personal data logged.')
      if (!response.headersSent) reply(response, 500, { ok: false, error: 'Unable to process this enquiry. Please try again.' })
      else response.end()
    }
  }
}
