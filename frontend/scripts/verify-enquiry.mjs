import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createServer } from 'node:http'
import { test } from 'node:test'
import { createEnquiryHandler } from '../server/enquiry.mjs'

const config = { RESEND_API_KEY: 'test-key-not-a-real-secret', RESEND_FROM: 'Entrolix <info@entrolix.com>', ENQUIRY_TO: 'info@entrolix.com', SITE_ORIGIN: 'https://entrolix.example' }
const values = { name: 'Website Test', email: 'visitor@example.com', phone: '+91 1234567890', organization: 'Test organization', subject: 'Training enquiry', message: 'Please share the course details.' }

async function fixture(t, options = {}) {
  const calls = []
  const handler = createEnquiryHandler({ env: config, logger: { warn() {} }, fetchImpl: async (url, init) => {
    calls.push({ url, ...init })
    return Response.json({ id: 'mock-provider-message-id' })
  }, ...options })
  const server = createServer((req, res) => void handler(req, res))
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections() }))
  const url = `http://127.0.0.1:${server.address().port}/api/enquiry`
  async function submit(overrides = {}, headers = {}, extra = {}) {
    const form = new FormData()
    for (const [key, value] of Object.entries({ ...values, ...overrides })) form.append(key, value)
    return fetch(url, { method: 'POST', body: form, headers: { Origin: config.SITE_ORIGIN, 'X-Enquiry-Id': randomUUID(), ...headers }, ...extra })
  }
  return { calls, url, submit }
}

test('Valid enquiry reaches Resend with fixed sender/recipient and visitor Reply-To', async t => {
  const { calls, submit } = await fixture(t)
  const response = await submit({ to: 'attacker@example.com', from: 'attacker@example.com', message: '<script>not HTML</script>' })
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { ok: true })
  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, 'https://api.resend.com/emails')
  assert.equal(calls[0].method, 'POST')
  assert.equal(calls[0].headers.Authorization, 'Bearer ' + config.RESEND_API_KEY)
  const payload = JSON.parse(calls[0].body)
  assert.deepEqual(payload.to, ['info@entrolix.com'])
  assert.equal(payload.from, config.RESEND_FROM)
  assert.equal(payload.reply_to, values.email)
  assert.equal(payload.html, undefined, 'Untrusted content is sent as plain text')
  for (const name of ['name', 'phone', 'organization', 'subject']) assert.ok(payload.text.includes(values[name]))
  assert.ok(payload.text.includes('<script>not HTML</script>'))
})

test('Unchanged retries reuse idempotency key; changed content gets a different key', async t => {
  const { calls, submit } = await fixture(t)
  const headers = { 'X-Enquiry-Id': randomUUID() }
  await submit({}, headers)
  await submit({}, headers)
  await submit({ message: 'A different enquiry' }, headers)
  assert.equal(calls[0].headers['Idempotency-Key'], calls[1].headers['Idempotency-Key'])
  assert.notEqual(calls[1].headers['Idempotency-Key'], calls[2].headers['Idempotency-Key'])
})

for (const [label, overrides] of Object.entries({ empty: { name: '  ' }, email: { email: 'not-an-email' }, tooLong: { message: 'x'.repeat(4001) }, headers: { subject: 'Hello\r\nBcc: someone@example.com' }, honeypot: { _gotcha: 'bot' } })) {
  test(`Rejects invalid input: ${label}`, async t => {
    const { calls, submit } = await fixture(t)
    assert.equal((await submit(overrides)).status, 400)
    assert.equal(calls.length, 0)
  })
}

test('Optional fields may be empty', async t => {
  const { submit } = await fixture(t)
  assert.equal((await submit({ phone: '', organization: '' })).status, 200)
})

test('Rejects wrong method, foreign origin, absent origin and invalid identifier', async t => {
  const { calls, url, submit } = await fixture(t)
  assert.equal((await fetch(url)).status, 405)
  assert.equal((await submit({}, { Origin: 'https://evil.example' })).status, 403)
  assert.equal((await submit({}, { Origin: '' })).status, 403)
  assert.equal((await submit({}, { 'X-Enquiry-Id': 'bad' })).status, 400)
  assert.equal(calls.length, 0)
})

test('Enforces body format and size', async t => {
  const { calls, submit } = await fixture(t)
  assert.equal((await submit({}, { 'Content-Type': 'application/json' }, { body: '{}' })).status, 415)
  assert.equal((await submit({ message: 'x'.repeat(40000) })).status, 413)
  assert.equal(calls.length, 0)
})

test('Rejects duplicate fields and uploaded files', async t => {
  const { calls, submit } = await fixture(t)
  const duplicate = new FormData()
  for (const [key, value] of Object.entries(values)) duplicate.append(key, value)
  duplicate.append('email', 'another@example.com')
  assert.equal((await submit({}, {}, { body: duplicate })).status, 400)
  assert.equal((await submit({ name: new Blob(['file']) })).status, 400)
  assert.equal(calls.length, 0)
})

test('Fails safely when server configuration is missing', async t => {
  const { calls, submit } = await fixture(t, { env: { ...config, RESEND_API_KEY: '' } })
  assert.equal((await submit()).status, 503)
  assert.equal(calls.length, 0)
})

for (const [label, fetchImpl] of Object.entries({
  rejected: async () => Response.json({ message: 'domain not verified' }, { status: 403 }),
  malformed: async () => new Response('<html>Bad gateway</html>'),
  noId: async () => Response.json({ ok: true }),
  network: async () => { throw new Error('network failure') },
  timeout: async () => { throw new DOMException('Timeout', 'TimeoutError') },
})) {
  test(`Does not claim success on provider ${label}`, async t => {
    const { submit } = await fixture(t, { fetchImpl })
    const response = await submit()
    assert.equal(response.status, 502)
    const text = await response.text()
    assert.equal(JSON.parse(text).ok, false)
    assert.ok(!text.includes(config.RESEND_API_KEY))
    assert.ok(!text.includes(values.email))
  })
}

test('Limits repeated submissions even with spoofed forwarding headers; window expires', async t => {
  let time = 1000
  const { calls, submit } = await fixture(t, { now: () => time })
  for (let count = 0; count < 5; count++) assert.equal((await submit({}, { 'X-Forwarded-For': `192.0.2.${count}` })).status, 200)
  const blocked = await submit()
  assert.equal(blocked.status, 429)
  assert.equal(blocked.headers.get('retry-after'), '600')
  assert.equal(calls.length, 5)
  time += 600001
  assert.equal((await submit()).status, 200)
})
