import { ArrowRight, Bot, Check, Sparkles } from 'lucide-react'
import { beliefs, company } from './company'
import { Breadcrumbs } from './components/SiteLayout'
import { serviceGroups } from './catalog'

export default function AboutPage() {
  return <main id="main-content" className="about-page">
    <section className="page-hero about-hero container">
      <Breadcrumbs items={[{ label: 'About' }]} />
      <div className="eyebrow"><Sparkles size={15} aria-hidden="true" /> ABOUT ENTROLIX</div>
      <h1>We’re building<br />what’s <em>next.</em></h1>
      <div className="about-hero-bottom"><p>{company.introduction}</p><a className="button button-dark" href="/services">Explore our services <ArrowRight size={17} aria-hidden="true" /></a></div>
      <div className="about-manifesto"><div className="manifesto-orbit" aria-hidden="true"><span className="manifesto-icon"><Bot size={46} /></span><i className="manifesto-dot dot-one" /><i className="manifesto-dot dot-two" /><span className="orbit-word word-one">BUILD</span><span className="orbit-word word-two">AUTOMATE</span><span className="orbit-word word-three">INNOVATE</span></div><div><span className="label">EMPOWERING POSSIBILITIES</span><h2>Better technology.<br /><em>Better possibilities.</em></h2><p>{company.belief}</p></div></div>
    </section>

    <section className="container about-pillars" aria-label="Our three core services">{serviceGroups.map(({ id, title, description, icon: Icon, accent }) => <a className={`about-pillar accent-${accent}`} href={`/${id}`} key={id}><Icon size={26} aria-hidden="true" /><h2>{title}</h2><p>{description}</p><span className="text-link">Explore {title.toLowerCase()}<ArrowRight size={17} aria-hidden="true" /></span></a>)}</section>
    <section className="company-story container reveal" aria-labelledby="company-story-heading"><div><span className="label">OUR STORY</span><h2 id="company-story-heading">Young minds.<br />Bold ideas.<br />Intelligent technology.</h2></div><div className="company-story-copy"><p>{company.origin}</p><p className="story-emphasis">{company.challenge}</p><p>{company.approach}</p><p>{company.solutions}</p></div></section>

    <section className="company-beliefs" aria-labelledby="company-beliefs-heading"><div className="container"><div className="section-heading split"><div><span className="label">WHAT WE BELIEVE</span><h2 id="company-beliefs-heading">Build bold.<br />Think fresh. Move fast.</h2></div><p>{company.valuesIntroduction}</p></div><p className="beliefs-introduction">Our approach combines:</p><div className="belief-grid">{beliefs.map(({ icon: Icon, title, description }, index) => <article className="belief-card reveal" key={title}><div className="belief-card-top"><Icon size={27} aria-hidden="true" /><span>0{index + 1}</span></div><h3>{title}</h3><p>{description}</p></article>)}</div></div></section>

    <section className="company-direction" aria-label="Our vision and mission"><div className="container direction-grid"><article className="direction-card reveal"><span className="label">OUR VISION</span><h2>{company.visionHeadline}</h2><p>{company.vision}</p><p className="direction-note">{company.ambition}</p></article><article className="direction-card reveal"><span className="label">OUR MISSION</span><h2>Intelligent solutions.<br />Real possibilities.</h2><p>{company.mission}</p><a className="text-action" href="/services">See how we put it into practice <ArrowRight size={17} aria-hidden="true" /></a></article></div></section>

    <section className="company-why container reveal" aria-labelledby="company-why-heading"><div><span className="label">WHY ENTROLIX?</span><h2 id="company-why-heading">Because we bring<br />a different energy.</h2><p>{company.promise}</p><p className="company-promise">{company.closing}</p></div><ul className="company-why-list">{company.why.map(item => <li key={item}><Check size={20} aria-hidden="true" /><span>{item}.</span></li>)}</ul></section>

    <section className="company-closing"><div className="container"><span className="label">ENTROLIX</span><h2>Fresh thinking.<br />Bold development.<br /><em>Intelligent future.</em></h2><a className="button button-dark" href="/contact">Build what’s next with us <ArrowRight size={18} aria-hidden="true" /></a></div></section>
  </main>
}
