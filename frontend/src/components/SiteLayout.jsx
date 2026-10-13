import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ArrowUpRight, ChevronDown, ChevronRight, LayoutGrid, Mail, Menu, X } from 'lucide-react'
import { getOfferings, offeringPath, serviceGroups } from '../catalog'
import { contactEmail } from '../contact'

const dropdownItemSelector = '[data-dropdown-item]'
const customApplications = getOfferings('consulting').filter(item => item.acronym)

const navigationLabels = {
  training: 'Training Services',
  consulting: 'IT Solutions',
  recruitment: 'Recruitment',
}

function NavigationIcon({ icon: Icon }) {
  return <span className="dropdown-icon" aria-hidden="true"><Icon size={20} strokeWidth={1.75} fill="none" focusable="false" /></span>
}

export function Header({ pathname }) {
  const [open, setOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [customAppsOpen, setCustomAppsOpen] = useState(false)
  const header = useRef(null)
  const toggle = useRef(null)
  const triggers = useRef({})
  const dropdowns = useRef({})
  const pendingFocus = useRef(null)
  const customAppsTrigger = useRef(null)
  const customAppsSubmenu = useRef(null)

  const selectDropdown = id => { setActiveDropdown(id); setCustomAppsOpen(false); pendingFocus.current = null }
  const closeAll = () => { setOpen(false); selectDropdown(null) }
  const closeDropdown = id => { if (activeDropdown === id) selectDropdown(null) }

  useEffect(() => {
    const close = event => {
      if (event.key !== 'Escape') return
      if (customAppsOpen) {
        setCustomAppsOpen(false)
        customAppsTrigger.current?.focus()
      } else if (activeDropdown) {
        setActiveDropdown(null)
        triggers.current[activeDropdown]?.focus()
      } else if (open) {
        setOpen(false)
        toggle.current?.focus()
      }
    }
    const outside = event => {
      if (!header.current?.contains(event.target)) {
        setActiveDropdown(null)
        setCustomAppsOpen(false)
        setOpen(false)
      }
    }
    window.addEventListener('keydown', close)
    document.addEventListener('pointerdown', outside)
    return () => {
      window.removeEventListener('keydown', close)
      document.removeEventListener('pointerdown', outside)
    }
  }, [open, activeDropdown, customAppsOpen])

  useEffect(() => {
    if (!activeDropdown || !pendingFocus.current) return
    const isSubmenu = pendingFocus.current.id === 'custom-applications'
    if (isSubmenu ? !customAppsOpen : pendingFocus.current.id !== activeDropdown) return
    const links = isSubmenu ? customAppsSubmenu.current?.querySelectorAll('a') : dropdowns.current[activeDropdown]?.querySelectorAll(dropdownItemSelector)
    const target = pendingFocus.current.position === 'last' ? links?.[links.length - 1] : links?.[0]
    target?.focus()
    pendingFocus.current = null
  }, [activeDropdown, customAppsOpen])

  useEffect(() => {
    const desktop = window.matchMedia?.('(min-width: 768px)')
    const reset = () => { setOpen(false); setActiveDropdown(null); setCustomAppsOpen(false); pendingFocus.current = null }
    desktop?.addEventListener?.('change', reset)
    return () => desktop?.removeEventListener?.('change', reset)
  }, [])

  const openWithKeyboard = (event, id) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    event.preventDefault()
    const position = event.key === 'ArrowUp' ? 'last' : 'first'
    if (activeDropdown === id) {
      const links = dropdowns.current[id]?.querySelectorAll(dropdownItemSelector)
      const target = position === 'last' ? links?.[links.length - 1] : links?.[0]
      target?.focus()
    } else {
      pendingFocus.current = { id, position }
      setCustomAppsOpen(false)
      setActiveDropdown(id)
    }
  }

  const navigateDropdown = (event, id) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
    const links = [...dropdowns.current[id].querySelectorAll(dropdownItemSelector)]
    const index = links.indexOf(document.activeElement)
    if (index < 0) return
    event.preventDefault()
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? links.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length
    links[next].focus()
  }

  const openCustomWithKeyboard = event => {
    if (event.key !== 'ArrowRight') return
    event.preventDefault()
    event.stopPropagation()
    if (customAppsOpen) customAppsSubmenu.current?.querySelector('a')?.focus()
    else {
      pendingFocus.current = { id: 'custom-applications', position: 'first' }
      setCustomAppsOpen(true)
    }
  }

  const navigateCustomApplications = event => {
    if (event.key === 'ArrowLeft' || event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      setCustomAppsOpen(false)
      customAppsTrigger.current?.focus()
      return
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    event.stopPropagation()
    const links = [...customAppsSubmenu.current.querySelectorAll('a')]
    const index = links.indexOf(document.activeElement)
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? links.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length
    links[next].focus()
  }

  return <header className="site-header" ref={header}>
    <nav className="container main-nav" aria-label="Main navigation">
      <a className="brand header-brand" href="/" aria-label="Entrolix home" onClick={closeAll}>
        <span className="header-wordmark" aria-hidden="true"><img src="/entrolix-logo.png" alt="" width="768" height="512" fetchPriority="high" /></span>
        <span className="header-tagline" aria-hidden="true">Empowering possibilities</span>
      </a>
      <div id="primary-navigation" className={`nav-links ${open ? 'open' : ''}`}>
        <div className="primary-links">
          <a href="/" aria-current={pathname === '/' ? 'page' : undefined} onClick={closeAll}>Home</a>
          {serviceGroups.map(({ id }) => {
            const label = navigationLabels[id]
            const isActive = pathname === `/${id}` || pathname.startsWith(`/${id}/`)
            return <div
              key={id} className="services-disclosure"
              onPointerEnter={event => {
                if (event.pointerType !== 'mouse' || !window.matchMedia?.('(min-width: 768px) and (hover: hover)').matches) return
                // Keep a keyboard-focused link visible when the pointer crosses another menu.
                if (activeDropdown && activeDropdown !== id && dropdowns.current[activeDropdown]?.contains(document.activeElement)) return
                if (activeDropdown !== id) selectDropdown(id)
              }}
              onPointerLeave={event => {
                if (event.pointerType === 'mouse' && !event.currentTarget.contains(document.activeElement)) closeDropdown(id)
              }}
              onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) closeDropdown(id) }}
            >
              <button
                ref={element => { triggers.current[id] = element }}
                id={`${id}-menu-trigger`} type="button"
                className={`services-trigger ${isActive ? 'active' : ''}`}
                aria-current={isActive ? 'true' : undefined}
                aria-expanded={activeDropdown === id} aria-controls={`${id}-dropdown`}
                onClick={() => selectDropdown(activeDropdown === id ? null : id)}
                onKeyDown={event => openWithKeyboard(event, id)}
              ><span>{label}</span><ChevronDown size={16} aria-hidden="true" /></button>
              <div
                id={`${id}-dropdown`} className={`services-dropdown ${id === 'consulting' ? 'it-solutions-dropdown' : ''}`}
                ref={element => { dropdowns.current[id] = element }}
                aria-labelledby={`${id}-menu-trigger`}
                hidden={activeDropdown !== id} onKeyDown={event => navigateDropdown(event, id)}
              >
                <div className="services-dropdown-panel">
                  <span className="dropdown-eyebrow">{label}</span>
                  {getOfferings(id).filter(item => id !== 'consulting' || item.slug === 'servicenow-implementation').map(item => <a data-dropdown-item key={item.slug} href={offeringPath(item)} aria-current={pathname === offeringPath(item) ? 'page' : undefined} onClick={closeAll}>
                    <NavigationIcon icon={item.icon} />
                    <span><strong>{item.acronym ? `${item.acronym} Development` : item.title}</strong>{item.acronym && <small>{item.shortTitle}</small>}</span>
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </a>)}
                  {id === 'consulting' ? <div
                    className="custom-applications"
                    onPointerEnter={event => {
                      if (event.pointerType === 'mouse' && window.matchMedia?.('(min-width: 768px) and (hover: hover)').matches) setCustomAppsOpen(true)
                    }}
                    onPointerLeave={event => {
                      if (event.pointerType === 'mouse' && !event.currentTarget.contains(document.activeElement)) setCustomAppsOpen(false)
                    }}
                    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setCustomAppsOpen(false) }}
                  >
                    <button
                      ref={customAppsTrigger} id="custom-applications-trigger" type="button" data-dropdown-item
                      className={`custom-applications-trigger ${customApplications.some(item => pathname === offeringPath(item)) ? 'active' : ''}`}
                      aria-expanded={activeDropdown === id && customAppsOpen} aria-controls="custom-applications-submenu"
                      onClick={() => setCustomAppsOpen(value => !value)} onKeyDown={openCustomWithKeyboard}
                    >
                      <NavigationIcon icon={LayoutGrid} />
                      <span><strong>Custom Applications</strong><small>Software built around your business</small></span>
                      <ChevronRight size={16} aria-hidden="true" />
                    </button>
                    <div
                      ref={customAppsSubmenu} id="custom-applications-submenu" className="custom-applications-submenu"
                      hidden={activeDropdown !== id || !customAppsOpen} onKeyDown={navigateCustomApplications}
                      aria-labelledby="custom-applications-trigger"
                    >
                      <div className="custom-applications-panel">
                        <span className="dropdown-eyebrow">Custom Applications</span>
                        {customApplications.map(item => <a key={item.slug} href={offeringPath(item)} aria-current={pathname === offeringPath(item) ? 'page' : undefined} onClick={closeAll}>
                          <NavigationIcon icon={item.icon} />
                          <span><strong>{item.acronym}</strong><small>{item.shortTitle}</small></span>
                          <ArrowUpRight size={16} aria-hidden="true" />
                        </a>)}
                      </div>
                    </div>
                  </div> : <a data-dropdown-item className="dropdown-all" href={`/${id}`} aria-current={pathname === `/${id}` ? 'page' : undefined} onClick={closeAll}>Explore {label}<ArrowRight size={16} aria-hidden="true" /></a>}
                </div>
              </div>
            </div>
          })}
        </div>
      </div>
      <div className="header-controls"><button ref={toggle} type="button" className="menu-button" onClick={() => { setOpen(value => !value); selectDropdown(null) }} aria-expanded={open} aria-controls="primary-navigation" aria-label={open ? 'Close navigation' : 'Open navigation'}>{open ? <X /> : <Menu />}</button></div>
    </nav>
  </header>
}

export function Footer() {
  return <footer className="site-footer"><div className="container"><div className="footer-top">
    <div className="footer-brand"><a className="brand" href="/" aria-label="Entrolix home"><img src="/entrolix-logo.png" alt="Entrolix" width="150" height="76" /></a><p>Skills, technology, and people.<br />Built for what comes next.</p><a className="footer-email" href={`mailto:${contactEmail}`}><Mail size={16} aria-hidden="true" />{contactEmail}</a></div>
    {serviceGroups.map(group => <nav className="footer-column" key={group.id} aria-label={`${group.title} links`}><a className="footer-heading" href={`/${group.id}`}>{group.title}</a>{getOfferings(group.id).map(item => <a href={offeringPath(item)} key={item.slug}>{item.acronym ? `${item.acronym} Development` : item.shortTitle}</a>)}</nav>)}
    </div><div className="footer-bottom"><p>© {new Date().getFullYear()} Entrolix. Empowering possibilities.</p><nav aria-label="Company links"><a href="/services">All services</a><a href="/about">About us</a><a href="/contact">Contact</a></nav></div></div></footer>
}

export function Breadcrumbs({ items }) {
  return <nav className="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li>{items.map((item, index) => <li key={item.label}><ChevronRight size={14} aria-hidden="true" />{index === items.length - 1 ? <span aria-current="page">{item.label}</span> : <a href={item.href}>{item.label}</a>}</li>)}</ol></nav>
}

export function ContactBanner({ title = 'Let’s plan your next step.', text = 'Tell us what you want to learn, build, or hire for. We’ll help you find the right starting point.', href = '/contact', label = 'Start a conversation' }) {
  return <section className="contact-banner" id="contact"><div className="container contact-banner-inner"><div><span className="eyebrow">START WITH A CONVERSATION</span><h2>{title}</h2><p>{text}</p></div><a className="button button-dark" href={href}>{label}<ArrowRight size={18} aria-hidden="true" /></a></div></section>
}

export function Steps({ steps, dark = false }) {
  return <ol className={`steps-grid ${dark ? 'steps-dark' : ''}`}>{steps.map(([title, text], index) => <li key={title}><span className="step-number">0{index + 1}</span><h3>{title}</h3><p>{text}</p></li>)}</ol>
}

export function FAQs({ items }) {
  return <section className="section container faq-layout"><div><span className="eyebrow">FREQUENTLY ASKED QUESTIONS</span><h2>Your questions, answered.</h2></div><div className="faq-list">{items.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></section>
}
