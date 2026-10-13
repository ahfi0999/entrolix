import { useEffect, useState } from 'react'
import { ArrowRight, Check, Mail } from 'lucide-react'
import { getGroup, getOfferings, offerings, serviceGroups } from '../catalog'
import { contactEmail } from '../contact'
import { Breadcrumbs } from '../components/SiteLayout'

export default function ContactPage({ endpoint = import.meta.env.VITE_FORM_ENDPOINT?.trim() || '' }) {
  const [service, setService] = useState('')
  const [status, setStatus] = useState({ kind: 'idle' })
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const requested = params.get('service')
    const category = params.get('category')
    if (offerings.some(item => `${item.group}/${item.slug}` === requested)) setService(requested)
    else if (getGroup(category)) setService(category)
  }, [])
  const selectedItem = offerings.find(item => `${item.group}/${item.slug}` === service)
  const selectedGroup = getGroup(selectedItem?.group || service)
  const selectedLabel = selectedItem?.title || selectedGroup?.title || 'General enquiry'

  const submit = async event => {
    event.preventDefault()
    if (status.kind === 'sending') return
    const form = event.currentTarget
    const data = new FormData(form)
    if (data.get('_gotcha')) return
    data.set('service', selectedLabel)
    data.set('subject', `Entrolix enquiry: ${selectedLabel}`)
    if (!endpoint) {
      const body = `Hello Entrolix,\n\nI am interested in: ${selectedLabel}\n\nName: ${data.get('name')}\nEmail: ${data.get('email')}\nOrganization: ${data.get('organization') || 'Not provided'}\n\n${data.get('message')}`
      const href = `mailto:${contactEmail}?subject=${encodeURIComponent(`Enquiry: ${selectedLabel}`)}&body=${encodeURIComponent(body)}`
      setStatus({ kind: 'draft', href })
      return
    }
    setStatus({ kind: 'sending' })
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { Accept: 'application/json' }, body: data, signal: AbortSignal.timeout(20000) })
      if (!response.ok) throw new Error('Unable to submit your enquiry. Please try again or email our team directly.')
      form.reset()
      setService('')
      setStatus({ kind: 'sent' })
    } catch {
      setStatus({ kind: 'error', text: `Your enquiry wasn’t submitted. Please try again or email ${contactEmail}. Your details are still here.` })
    }
  }

  return <main id="main-content"><section className="page-hero container contact-hero"><Breadcrumbs items={[{ label: 'Contact' }]} /><span className="eyebrow">TELL US WHAT’S NEXT</span><h1>Let’s start with<br /><em>your goal.</em></h1><p className="hero-description">A new skill, a better system, or the right hire. Tell us what you have in mind and we’ll help you take the next step.</p></section>
    <section className="container contact-page-grid section-after-hero"><aside className="contact-info"><a className="contact-email" href={`mailto:${contactEmail}`}><Mail size={22} aria-hidden="true" />{contactEmail}</a><h2>A little context goes a long way.</h2><div className="contact-guidance">{serviceGroups.map(group => <div key={group.id}><span className={`category-chip accent-${group.accent}`}>{group.title}</span><p>{group.id === 'training' ? 'Share the subject, your experience, and whether you’re enquiring for yourself or a team.' : group.id === 'consulting' ? 'Describe your business process, current systems, and what you want to improve.' : 'Include the role, required skills, location, number of openings, and hiring timeline.'}</p></div>)}</div><p className="contact-small">Looking for a role? Select a recruitment service and introduce your experience and interests.</p></aside>
      <div className="enquiry-form-panel"><div className="form-heading"><span className="eyebrow">YOUR ENQUIRY</span><h2>How can we help?</h2><p>{endpoint ? 'Share your details below to send an enquiry to our team.' : 'Prepare your enquiry below, then send it using your email app.'}</p></div>
        <form onSubmit={submit} onChange={() => { if (status.kind === 'draft' || status.kind === 'sent' || status.kind === 'error') setStatus({ kind: 'idle' }) }}>
          <label className="honeypot" aria-hidden="true">Leave this empty<input name="_gotcha" tabIndex={-1} autoComplete="off" /></label>
          <fieldset disabled={status.kind === 'sending'}><legend className="sr-only">Your contact information and enquiry</legend><div className="form-row"><label>Your name <span aria-hidden="true">*</span><input required autoComplete="name" name="name" maxLength={100} placeholder="Your full name" /></label><label>Email address <span aria-hidden="true">*</span><input required autoComplete="email" name="email" type="email" maxLength={254} placeholder="you@example.com" /></label></div>
            <label>Organization <span className="optional">(optional)</span><input autoComplete="organization" name="organization" maxLength={150} placeholder="Company or institution" /></label>
            <label>I’m interested in <span aria-hidden="true">*</span><select required name="service" value={service} onChange={event => setService(event.target.value)}><option value="">Choose a service</option>{serviceGroups.map(group => <optgroup key={group.id} label={group.title}><option value={group.id}>{group.title} — general enquiry</option>{getOfferings(group.id).map(item => <option key={item.slug} value={`${group.id}/${item.slug}`}>{item.title}</option>)}</optgroup>)}<option value="general">Something else</option></select></label>
            <label>Tell us what you need <span aria-hidden="true">*</span><textarea name="message" required rows={6} maxLength={4000} placeholder={selectedGroup?.id === 'training' ? 'Your experience, learning goals, and training needs…' : selectedGroup?.id === 'recruitment' ? 'The role, skills, location, and hiring requirements…' : 'Your requirements, priorities, and any useful context…'} /></label>
            <button className="button button-dark" type="submit">{status.kind === 'sending' ? 'Sending…' : endpoint ? 'Send enquiry' : 'Prepare email'}<ArrowRight size={17} aria-hidden="true" /></button>
          </fieldset>
          {status.kind === 'error' && <p className="form-error" role="alert">{status.text}</p>}
          <div className="form-feedback" aria-live="polite">{status.kind === 'sent' && <p className="form-success"><Check size={19} aria-hidden="true" />Your enquiry has been submitted. Thank you for getting in touch.</p>}{status.kind === 'draft' && <div className="email-draft"><strong>Your email draft is ready.</strong><p>Open it in your email app, review it, and press Send. Nothing has been sent yet.</p><a className="button button-dark" href={status.href}>Open email draft<Mail size={17} aria-hidden="true" /></a><p className="contact-small">No email app configured? Copy your message and email <a href={`mailto:${contactEmail}`}>{contactEmail}</a> directly.</p></div>}</div>
        </form>
      </div>
    </section>
  </main>
}
