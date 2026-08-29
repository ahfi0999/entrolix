import { useEffect, useState } from 'react'
import { ArrowRight, Braces, Check, ChevronRight, Database, Menu, Sparkles, X, Zap } from 'lucide-react'

const services = [
  { icon: Braces, number: '01', title: 'Digital product engineering', text: 'We turn high-value ideas into secure, intuitive products engineered for adoption, performance, and long-term growth.' },
  { icon: Database, number: '02', title: 'Cloud & data foundations', text: 'We modernize the systems behind your business with resilient cloud architecture, connected data, and APIs built to scale.' },
  { icon: Zap, number: '03', title: 'AI-powered transformation', text: 'We embed practical AI and automation into critical workflows to reduce friction, accelerate decisions, and unlock capacity.' },
]

const projects = [
  { type: 'DIGITAL FINANCE', title: 'A faster, clearer path from application to approval.', color: 'lime', stat: 'Faster', label: 'customer onboarding' },
  { type: 'INTELLIGENT OPERATIONS', title: 'One connected command center for a global operation.', color: 'violet', stat: 'Unified', label: 'operational visibility' },
]

const process = [
  { number: '01', title: 'Discover', text: 'We align on the business outcome, uncover the real constraints, and define what success must look like.' },
  { number: '02', title: 'Design', text: 'We turn insight into a focused product strategy, intuitive experience, and technically sound delivery plan.' },
  { number: '03', title: 'Build', text: 'Our teams engineer, test, and release in visible increments—keeping quality high and momentum measurable.' },
  { number: '04', title: 'Scale', text: 'We strengthen performance, automate operations, and evolve the platform as your users and ambitions grow.' },
]

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [formStatus, setFormStatus] = useState('idle')

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('is-visible'))
    }, { threshold: 0.12 })
    document.querySelectorAll('.reveal').forEach((element) => observer.observe(element))
    const moveGlow = (event) => {
      document.documentElement.style.setProperty('--mouse-x', `${event.clientX}px`)
      document.documentElement.style.setProperty('--mouse-y', `${event.clientY}px`)
    }
    window.addEventListener('pointermove', moveGlow)
    return () => { observer.disconnect(); window.removeEventListener('pointermove', moveGlow) }
  }, [])

  const submit = async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    setFormStatus('sending')
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/inquiries/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(Object.values(data).flat().join(' ') || 'Request failed')
      }
      form.reset()
      setFormStatus('sent')
    } catch (error) {
      setFormStatus(error.message || 'Unable to send your message right now.')
    }
  }

  const moveVisual = (event) => {
    const visual = event.currentTarget
    const rect = visual.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width
    const y = (event.clientY - rect.top) / rect.height
    visual.style.setProperty('--px', `${x * 100}%`)
    visual.style.setProperty('--py', `${y * 100}%`)
    visual.style.setProperty('--rx', `${(0.5 - y) * 7}deg`)
    visual.style.setProperty('--ry', `${(x - 0.5) * 9}deg`)
    visual.style.setProperty('--dx', `${(x - 0.5) * 26}px`)
    visual.style.setProperty('--dy', `${(y - 0.5) * 22}px`)
  }

  const resetVisual = (event) => {
    event.currentTarget.style.removeProperty('--rx')
    event.currentTarget.style.removeProperty('--ry')
    event.currentTarget.style.removeProperty('--dx')
    event.currentTarget.style.removeProperty('--dy')
  }

  return <div className="site-shell">
    <div className="cursor-glow" aria-hidden="true"></div>
    <nav className="nav container">
      <a className="brand" href="#top" aria-label="Entrolix home">
        <img src="/entrolix-logo.png" alt="EntroliX — Empowering Possibilities" />
      </a>
      <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu" aria-expanded={menuOpen} aria-controls="primary-navigation">{menuOpen ? <X /> : <Menu />}</button>
      <div id="primary-navigation" className={`nav-links ${menuOpen ? 'open' : ''}`}>
        <a href="#services" onClick={() => setMenuOpen(false)}>Services</a>
        <a href="#process" onClick={() => setMenuOpen(false)}>Process</a>
        <a href="#work" onClick={() => setMenuOpen(false)}>Work</a>
        <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
        <a className="nav-cta" href="#contact" onClick={() => setMenuOpen(false)}>Start a project <ArrowRight size={16} /></a>
      </div>
    </nav>

    <main id="top">
      <section className="hero container reveal is-visible">
        <div className="eyebrow"><Sparkles size={15} /> Strategy. Technology. Measurable advantage.</div>
        <h1>We engineer the digital advantage your business needs to <em>lead.</em></h1>
        <div className="hero-bottom">
          <div><p>Entrolix transforms ambitious business goals into intelligent digital products, scalable platforms, and high-performance systems that create lasting value.</p>
            <div className="hero-actions"><a className="primary-action" href="#contact">Start a project <ArrowRight size={17} /></a><a className="text-action" href="#work">Explore our work <ChevronRight size={17} /></a></div>
          </div>
          <a className="circle-link" href="#work" aria-label="See our work"><ArrowRight /></a>
        </div>
        <div className="hero-card tilt-card" onPointerMove={moveVisual} onPointerLeave={resetVisual}>
          <div className="visual-light" aria-hidden="true"></div>
          <div className="visual-noise" aria-hidden="true"></div>
          <div className="motion-ring ring-a" aria-hidden="true"><i></i></div>
          <div className="motion-ring ring-b" aria-hidden="true"><i></i></div>
          <div className="orb orb-one"></div><div className="orb orb-two"></div>
          <div className="floating-card card-a"><span className="pulse"></span> Resilient systems <strong>Always on</strong></div>
          <div className="floating-card card-b"><span>Product delivery</span><strong>Accelerated</strong><i></i></div>
          <div className="motion-chip chip-a">AI systems</div>
          <div className="motion-chip chip-b">Cloud native</div>
          <div className="motion-chip chip-c">Built to scale</div>
          <div className="hero-tag">ENGINEERED FOR IMPACT <ChevronRight size={16} /></div>
        </div>
      </section>

      <section className="marquee"><div>STRATEGY <span>✦</span> PRODUCT <span>✦</span> ENGINEERING <span>✦</span> AI <span>✦</span> CLOUD <span>✦</span> GROWTH</div></section>

      <section className="proof-strip container reveal" aria-label="How Entrolix delivers">
        <div><strong>End-to-end</strong><span>From strategy to scale</span></div>
        <div><strong>Security-first</strong><span>Built into every layer</span></div>
        <div><strong>Outcome-led</strong><span>Focused on business value</span></div>
        <div><strong>Senior-led</strong><span>Expertise where it matters</span></div>
      </section>

      <section id="services" className="section container reveal">
        <div className="section-heading"><span>WHAT WE DO</span><h2>Build what moves<br />your business forward.</h2><p>From first strategy to final release, we unite business thinking, exceptional design, and deep engineering to deliver technology that performs in the real world.</p></div>
        <div className="service-grid">
          {services.map(({ icon: Icon, number, title, text }) => <article className="service-card" key={title}>
            <div className="service-top"><Icon /><span>{number}</span></div><h3>{title}</h3><p>{text}</p><a href="#contact">Explore service <ArrowRight size={16} /></a>
          </article>)}
        </div>
      </section>

      <section id="process" className="section process-section reveal">
        <div className="container">
          <div className="section-heading split"><div><span>HOW WE WORK</span><h2>Clarity at every step.<br />Momentum from day one.</h2></div><p>A disciplined delivery model keeps priorities sharp, decisions fast, and every investment connected to a meaningful outcome.</p></div>
          <div className="process-grid">
            {process.map((step) => <article className="process-step" key={step.number}><span>{step.number}</span><h3>{step.title}</h3><p>{step.text}</p></article>)}
          </div>
          <div className="process-cta"><p>Have a complex challenge that needs a clear path forward?</p><a href="#contact">Let’s solve it together <ArrowRight size={17} /></a></div>
        </div>
      </section>

      <section id="work" className="section work-section reveal">
        <div className="container">
          <div className="section-heading split"><div><span>SELECTED WORK</span><h2>Complex challenges.<br />Decisive outcomes.</h2></div><p>We focus every engagement on the outcomes that matter: faster growth, stronger operations, better customer experiences, and technology ready for what comes next.</p></div>
          <div className="project-grid">
            {projects.map((project, index) => <article className={`project ${project.color}`} key={project.title}>
              <div className="project-copy"><span>{project.type}</span><h3>{project.title}</h3><a href="#contact">Discuss this solution <ArrowRight size={16} /></a></div>
              <div className="project-visual">
                <div className="mini-window"><div className="window-bar"><i></i><i></i><i></i></div><div className="window-content"><div className="fake-nav"></div><div className="metric"><small>{project.label}</small><strong>{project.stat}</strong></div><div className={`chart chart-${index}`}><b></b><b></b><b></b><b></b><b></b></div></div></div>
              </div>
            </article>)}
          </div>
        </div>
      </section>

      <section id="about" className="section container about reveal">
        <div><span className="label">WHY ENTROLIX</span><h2>Built to think.<br />Driven to deliver.</h2></div>
        <div className="about-copy"><p>We work as an extension of your leadership and technology teams—bringing clarity to complexity, momentum to execution, and accountability to every decision.</p>
          {['Senior expertise focused on your highest-value priorities', 'Transparent execution with clear ownership and momentum', 'Secure, scalable systems designed for enduring advantage'].map(item => <div className="check" key={item}><Check size={16} />{item}</div>)}
        </div>
      </section>

      <section id="contact" className="contact-section reveal">
        <div className="container contact-grid">
          <div><span className="label">START A CONVERSATION</span><h2>Your next advantage<br /><em>starts here.</em></h2><p>Tell us where your business needs to go. We’ll bring the strategic clarity, technical depth, and execution strength to help you get there.</p></div>
          <form onSubmit={submit}>
            <label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex="-1" autoComplete="off" /></label>
            <label>Your name<input required name="name" placeholder="Jane Smith" /></label>
            <label>Work email<input required type="email" name="email" placeholder="jane@company.com" /></label>
            <label>What outcome are you working toward?<textarea required name="message" placeholder="Tell us about your goals, challenge, and timeline..." rows="4"></textarea></label>
            <button type="submit" disabled={formStatus === 'sending'}>{formStatus === 'sending' ? 'Sending…' : formStatus === 'sent' ? 'Message sent' : 'Start the conversation'} {formStatus === 'sent' ? <Check size={18} /> : <ArrowRight size={18} />}</button>
            {formStatus !== 'idle' && formStatus !== 'sending' && formStatus !== 'sent' && <p className="form-error" role="alert">{formStatus}</p>}
            <p className="form-status" aria-live="polite">{formStatus === 'sent' ? 'Thank you. Your message has been received.' : ''}</p>
          </form>
        </div>
      </section>
    </main>

    <footer className="container"><a className="brand" href="#top" aria-label="Entrolix home"><img src="/entrolix-logo.png" alt="EntroliX — Empowering Possibilities" /></a><p>© 2026 Entrolix. Built with care.</p><div><a href="#services">Services</a><a href="#contact">Contact</a></div></footer>
  </div>
}

export default App
