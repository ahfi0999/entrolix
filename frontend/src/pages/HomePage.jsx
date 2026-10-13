import { ArrowDown, ArrowRight, ArrowUpRight, Check } from 'lucide-react'
import { serviceGroups } from '../catalog'
import { PillarCards } from '../components/ServiceCards'
import { ContactBanner, Steps } from '../components/SiteLayout'

export default function HomePage() {
  return <main id="main-content" className="home-page"><div className="home-hero-band">
    <section className="container home-hero" data-motion-scene>
      <div className="home-hero-copy">
        <span className="eyebrow" data-reveal data-reveal-delay="30"><i className="status-dot" aria-hidden="true" />TRAINING · IT CONSULTING · RECRUITMENT</span>
        <h1>
          <span className="hero-line"><span data-reveal="line" data-reveal-delay="80">Build skills.</span></span>{' '}
          <span className="hero-line"><span data-reveal="line" data-reveal-delay="170">Create solutions.</span></span>{' '}
          <span className="hero-line"><em data-reveal="line" data-reveal-delay="260">Find talent.</em></span>
        </h1>
        <p data-reveal data-reveal-delay="320">From your next career move to your next business milestone, Entrolix brings learning, technology, and people together.</p>
        <div className="hero-actions" data-reveal data-reveal-delay="380"><a className="button button-lime" href="/services">Our Services<ArrowRight size={18} aria-hidden="true" /></a><a className="text-link" href="/contact">Get a consultation<ArrowUpRight size={18} aria-hidden="true" /></a></div>
        <a className="scroll-cue" href="#services" data-reveal data-reveal-delay="440"><span className="scroll-cue-line" aria-hidden="true" /><span>SCROLL TO EXPLORE</span><ArrowDown size={14} aria-hidden="true" /></a>
      </div>
      <div className="hero-map-stage" data-reveal data-reveal-delay="180">
        <div className="hero-map" data-tilt data-motion-scene>
          <div className="hero-atmosphere" aria-hidden="true"><span className="hero-glow glow-violet" /><span className="hero-glow glow-lime" /></div>
          <svg className="hero-orbit" viewBox="0 0 500 560" fill="none" aria-hidden="true" focusable="false">
            <circle className="orbit-ring" cx="250" cy="280" r="222" />
            <circle className="orbit-ring orbit-ring-inner" cx="250" cy="280" r="179" />
            <circle className="orbit-trail" cx="250" cy="280" r="222" />
          </svg>
          <div className="hero-map-heading"><span className="eyebrow"><i className="signal-dot" aria-hidden="true" />THREE WAYS FORWARD</span><span className="map-corner" aria-hidden="true">↗</span></div>
          {serviceGroups.map(({ id, icon: Icon, title, accent, number }) => <a className={`hero-map-card accent-${accent}`} href={`/${id}`} key={id}><span className="map-icon"><Icon size={26} aria-hidden="true" /></span><div><span className="map-number">{number} / {id === 'training' ? 'LEARN' : id === 'consulting' ? 'BUILD' : 'GROW'}</span><strong>{title}</strong></div><ArrowUpRight size={22} aria-hidden="true" /></a>)}
          <p className="hero-map-note">Different needs. One place to start.</p>
        </div>
        <span className="hero-stage-caption" aria-hidden="true"><span>ENTROLIX / CONNECTED POSSIBILITIES</span><span>01 — 03</span></span>
      </div>
    </section></div>
    <section className="focus-strip" aria-label="Our focus"><div className="container"><span>Learn with purpose</span><i aria-hidden="true">✦</i><span>Build with clarity</span><i aria-hidden="true">✦</i><span>Hire with confidence</span></div></section>
    <section id="services" className="section container"><div className="section-intro"><div><span className="eyebrow">WHAT WE DO</span><h2>Three services.<br />A clearer path forward.</h2></div><p>Choose the support that fits your next step: develop practical skills, build better business systems, or find the people your team needs.</p></div><PillarCards /></section>
    <section className="home-approach" id="process"><div className="container section"><div className="section-intro"><div><span className="eyebrow">HOW WE WORK</span><h2>Start with your goal.<br />Build a practical plan.</h2></div><p>A training enquiry, a software requirement, or a hiring brief — every engagement starts by understanding what you need.</p></div><Steps dark steps={[
      ['Listen', 'Tell us about your goals, your current situation, and what needs to change.'],
      ['Define', 'Agree on the right service, scope, priorities, and next steps.'],
      ['Work together', 'Learn, build, or hire through a process shaped around your requirements.'],
      ['Move forward', 'Review the outcome and identify the next useful step.'],
    ]} /></div></section>
    <section className="section container home-about" id="about"><div><span className="eyebrow">WHY ENTROLIX</span><h2>Fresh thinking.<br />Practical direction.</h2><a className="text-link" href="/about">Get to know Entrolix<ArrowUpRight size={18} aria-hidden="true" /></a></div><div><p className="lead">We bring training, IT consulting, and recruitment together because business progress depends on both capable people and useful technology.</p><ul className="check-list">{['Clear service paths for learners, businesses, and hiring teams', 'Practical discussions around your goals and current needs', 'Technology expertise connected to skills and talent'].map(text => <li key={text}><Check size={18} aria-hidden="true" />{text}</li>)}</ul></div></section>
    <ContactBanner />
  </main>
}
