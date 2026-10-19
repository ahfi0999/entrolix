import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, Mail } from 'lucide-react'
import { getGroup, offerings } from '../catalog'
import { contactEmail } from '../contact'
import { Breadcrumbs } from '../components/SiteLayout'

const fields = [
  { name: 'name', label: 'Full name', required: true, autoComplete: 'name', maxLength: 100, placeholder: 'Your full name' },
  { name: 'email', label: 'Email address', required: true, type: 'email', autoComplete: 'email', maxLength: 254, placeholder: 'you@example.com' },
  { name: 'phone', label: 'Phone number', type: 'tel', autoComplete: 'tel', maxLength: 40, placeholder: 'Include your country code' },
  { name: 'company', label: 'Company name', autoComplete: 'organization', maxLength: 150, placeholder: 'Your company or organization' },
  { name: 'subject', label: 'Subject', required: true, maxLength: 180, placeholder: 'What would you like to discuss?' },
  { name: 'message', label: 'Message', required: true, maxLength: 4000, placeholder: 'Tell us a little about your question or requirement.' },
]

function fieldError(name, value) {
  const field = fields.find(item => item.name === name)
  if (!field) return ''
  const text = value.trim()
  if (field.required && !text) return {
    name: 'Please enter your full name.',
    email: 'Please enter your email address.',
    subject: 'Please add a subject.',
    message: 'Please tell us how we can help.',
  }[name]
  if (text.length > field.maxLength) return `Please use ${field.maxLength} characters or fewer.`
  if (name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return 'Enter a valid email address, such as name@example.com.'
  return ''
}

function EnquiryField({ field, error }) {
  const { name, label, required = false, ...attributes } = field
  const id = `enquiry-${name}`
  const inputProps = { ...attributes, id, name, required, 'aria-invalid': error ? true : undefined, 'aria-describedby': error ? `${id}-error` : undefined }
  return <div className="enquiry-field">
    <label htmlFor={id}>{label}{required ? <span aria-hidden="true"> *</span> : <span className="optional"> (optional)</span>}</label>
    {name === 'message' ? <textarea {...inputProps} rows={5} /> : <input {...inputProps} />}
    {error && <p id={`${id}-error`} className="enquiry-field-error">{error}</p>}
  </div>
}

export default function ContactPage({ endpoint = import.meta.env.VITE_FORM_ENDPOINT?.trim() || 'https://formspree.io/f/xzedqjpr' }) {
  const [status, setStatus] = useState({ kind: 'idle' })
  const [errors, setErrors] = useState({})
  const [ready, setReady] = useState(false)
  const formRef = useRef(null)
  const pending = useRef(false)
  const errorCount = Object.values(errors).filter(Boolean).length

  useEffect(() => {
    // Existing service/category URLs still work, without a service selector.
    const params = new URLSearchParams(window.location.search)
    const item = offerings.find(item => `${item.group}/${item.slug}` === params.get('service'))
    const label = item?.title || getGroup(params.get('category'))?.title
    const subject = formRef.current?.elements.namedItem('subject')
    if (label && subject && !subject.value) subject.value = `Enquiry: ${label}`
    setReady(true)
  }, [])

  const onChange = event => {
    const { name, value } = event.target
    setErrors(current => current[name] ? { ...current, [name]: fieldError(name, value) } : current)
    if (['draft', 'sent', 'error'].includes(status.kind)) setStatus({ kind: 'idle' })
  }

  const onBlur = event => {
    const { name, value } = event.target
    if (fields.some(field => field.name === name)) {
      setErrors(current => ({ ...current, [name]: fieldError(name, value) }))
    }
  }

  const submit = async event => {
    event.preventDefault()
    // The synchronous ref also blocks two submit events in the same render.
    if (!ready || pending.current) return
    const form = event.currentTarget
    const data = new FormData(form)
    if (data.get('_gotcha')) return
    const nextErrors = {}
    for (const field of fields) {
      const value = String(data.get(field.name) || '').trim()
      data.set(field.name, value)
      const error = fieldError(field.name, value)
      if (error) nextErrors[field.name] = error
    }
    const emailInput = form.elements.namedItem('email')
    if (!nextErrors.email && emailInput.validity.typeMismatch) nextErrors.email = 'Enter a valid email address, such as name@example.com.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      setStatus({ kind: 'idle' })
      form.elements.namedItem(Object.keys(nextErrors)[0])?.focus()
      return
    }
    if (!endpoint) {
      const body = `Hello Entrolix,\n\nName: ${data.get('name')}\nEmail: ${data.get('email')}\nPhone: ${data.get('phone') || 'Not provided'}\nCompany: ${data.get('company') || 'Not provided'}\n\n${data.get('message')}`
      const href = `mailto:${contactEmail}?subject=${encodeURIComponent(data.get('subject'))}&body=${encodeURIComponent(body)}`
      setStatus({ kind: 'draft', href })
      return
    }
    pending.current = true
    setStatus({ kind: 'sending' })
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { Accept: 'application/json' }, body: data, signal: AbortSignal.timeout(20000) })
      if (!response.ok) throw new Error('Submission was not accepted')
      // An HTML fallback, malformed response, or provider error is not success.
      if (!response.headers?.get('content-type')?.includes('application/json')) throw new Error('Unexpected server response')
      const result = await response.json()
      if (result?.ok !== true || result?.success === false || result?.errors?.length || result?.error) throw new Error('Missing submission confirmation')
      form.reset()
      setStatus({ kind: 'sent' })
    } catch {
      setStatus({ kind: 'error', text: `We couldn’t confirm your enquiry. Your details are still here. Please try again or email ${contactEmail}.` })
    } finally {
      pending.current = false
    }
  }

  return <main id="main-content" className="internal-page contact-page contact-minimal">
    <section className="container contact-enquiry" aria-labelledby="contact-heading">
      <Breadcrumbs items={[{ label: 'Contact' }]} />
      <div className="contact-intro">
        <span className="eyebrow">GET IN TOUCH</span>
        <h1 id="contact-heading">Let's start a conversation.</h1>
        <p>Have a question or a requirement? Send us a message and our team will get back to you.</p>
      </div>
      <div className="enquiry-form-panel">
        <noscript><p className="no-script-notice">The enquiry form needs JavaScript. Email <a href={`mailto:${contactEmail}`}>{contactEmail}</a> instead.</p></noscript>
        <form ref={formRef} action={endpoint || undefined} method="POST" noValidate aria-labelledby="contact-heading" aria-describedby="enquiry-note enquiry-delivery" aria-busy={status.kind === 'sending'} onSubmit={submit} onChange={onChange} onBlur={onBlur}>
          <label className="honeypot" aria-hidden="true">Leave this empty<input name="_gotcha" tabIndex={-1} autoComplete="off" /></label>
          <fieldset disabled={!ready || status.kind === 'sending'}>
            <legend className="sr-only">Your contact information and enquiry</legend>
            <div className="form-row">{fields.slice(0, 2).map(field => <EnquiryField key={field.name} field={field} error={errors[field.name]} />)}</div>
            <div className="form-row">{fields.slice(2, 4).map(field => <EnquiryField key={field.name} field={field} error={errors[field.name]} />)}</div>
            {fields.slice(4).map(field => <EnquiryField key={field.name} field={field} error={errors[field.name]} />)}
            <p id="enquiry-note" className="enquiry-note">* Required. Please leave out sensitive or confidential information.</p>
            <div className="enquiry-actions">
              <button className="button button-dark" type="submit">{status.kind === 'sending' ? 'Sending…' : endpoint ? 'Send enquiry' : 'Prepare email'}<ArrowRight size={17} aria-hidden="true" /></button>
              <p id="enquiry-delivery">{endpoint ? 'Your enquiry will be sent to our team.' : 'Prepare a draft, then send it from your email app.'}</p>
            </div>
          </fieldset>
          {errorCount > 0 && <p className="enquiry-validation-summary" role="alert">Please check {errorCount === 1 ? 'the highlighted field' : `the ${errorCount} highlighted fields`} before continuing.</p>}
          {status.kind === 'error' && <p className="form-error" role="alert">{status.text}</p>}
          <div className="form-feedback" role="status" aria-live="polite" aria-atomic="true">
            {status.kind === 'sending' && <p className="enquiry-sending">Sending your enquiry…</p>}
            {status.kind === 'sent' && <p className="form-success"><Check size={19} aria-hidden="true" />Your enquiry has been submitted. Thank you for getting in touch.</p>}
            {status.kind === 'draft' && <div className="email-draft"><strong>Your email draft is ready.</strong><p>Open it in your email app, review it, and press Send. Nothing has been sent yet.</p><a className="button button-dark" href={status.href}>Open email draft<Mail size={17} aria-hidden="true" /></a><p className="contact-small">No email app? Copy your message and email <a href={`mailto:${contactEmail}`}>{contactEmail}</a> directly.</p></div>}
          </div>
        </form>
      </div>
      <p className="contact-direct">Prefer email? <a href={`mailto:${contactEmail}`}>{contactEmail}<ArrowRight size={15} aria-hidden="true" /></a></p>
    </section>
  </main>
}
