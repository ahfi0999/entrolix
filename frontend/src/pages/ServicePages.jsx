import { ArrowLeft, ArrowRight, ArrowUpRight, Check } from 'lucide-react'
import { enquiryPath, getOfferings, offeringPath } from '../catalog'
import { OfferingCards, PillarCards } from '../components/ServiceCards'
import { Breadcrumbs, ContactBanner, FAQs, Steps } from '../components/SiteLayout'
import { PagePhoto, TopicJourney } from '../components/PageMedia'
import { categoryPresentation, offeringPresentation } from '../internal-content'

const categoryHeadlines = {
  training: ['Practical skills.', 'Built for your next step.'],
  consulting: ['Enterprise solutions.', 'Built around your business.'],
  recruitment: ['The right capabilities.', 'For your workforce needs.'],
}

function ServiceHero({ breadcrumbs, label, headline, description, href, actionLabel = 'Discuss your goals', secondaryHref, secondaryLabel, visual, children }) {
  return <section className="service-hero" data-motion-scene>
    <div className="service-hero-light" aria-hidden="true" />
    <div className="container">
      <Breadcrumbs items={breadcrumbs} />
      <div className={`service-hero-layout ${visual ? 'with-aside' : ''}`}>
        <div className="service-hero-copy">
          <span className="eyebrow" data-reveal>{label}</span>
          <h1 data-reveal data-reveal-delay="80">{Array.isArray(headline) ? <>{headline[0]}<br />{headline[1]}</> : headline}</h1>
          <p className="hero-description" data-reveal data-reveal-delay="160">{description}</p>
          <div className="hero-actions" data-reveal data-reveal-delay="220">
            <a className="button button-lime" href={href}>{actionLabel}<ArrowUpRight size={18} aria-hidden="true" /></a>
            {secondaryHref && <a className="text-link hero-secondary" href={secondaryHref}>{secondaryLabel}<ArrowRight size={17} aria-hidden="true" /></a>}
          </div>
        </div>
        {visual}
      </div>
      {children}
    </div>
  </section>
}

export function ServicesOverview() {
  return <main id="main-content" className="internal-page services-page">
    <ServiceHero
      breadcrumbs={[{ label: 'Services' }]}
      label="TRAINING · IT CONSULTING · RECRUITMENT"
      headline={['Skills. Solutions. Talent.', 'Built around your next step.']}
      description="Three focused services for individuals, technology teams, and employers. Develop practical skills, build useful business systems, and find the people who move your business forward."
      href="/contact" secondaryHref="#service-areas" secondaryLabel="Explore our services"
      visual={<PagePhoto name="team" caption="Skills, systems and people — connected by the work." priority />}
    />
    <section className="container section service-capabilities" id="service-areas">
      <div className="section-intro"><div><span className="eyebrow">OUR SERVICES</span><h2>Where we can help.</h2></div><p>Explore a service to understand its scope, who it is for, and how we can work with you.</p></div>
      <PillarCards />
    </section>
    <FAQs items={[
      ['Which service is right for me?', 'Choose Training to develop technology skills, IT Consulting to implement or improve business systems, or Recruitment to discuss permanent, temporary, and technical hiring needs.'],
      ['Can I discuss more than one service?', 'Yes. Tell us about your overall goals so we can discuss the relevant training, technology, and staffing requirements together.'],
      ['How do I get started?', 'Use the enquiry form or email info@entrolix.com with a short description of your goals. We can then discuss the appropriate scope and next steps.'],
    ]} />
    <ContactBanner />
  </main>
}

export function CategoryPage({ group }) {
  const Icon = group.icon
  const presentation = categoryPresentation[group.id]
  const categoryLabel = group.id === 'training' ? 'Training Services' : group.title
  return <main id="main-content" className={`internal-page category-page internal-${group.id} theme-${group.accent}`}>
    <ServiceHero
      breadcrumbs={[{ label: 'Services', href: '/services' }, { label: categoryLabel }]}
      label={categoryLabel}
      headline={categoryHeadlines[group.id]}
      description={group.intro}
      href={`/contact?category=${group.id}`}
      actionLabel={group.action}
      secondaryHref={`#${group.id}-offerings`}
      secondaryLabel={group.id === 'training' ? 'Explore training' : 'Explore capabilities'}
      visual={<PagePhoto name={presentation.photo} caption={presentation.caption} priority />}
    >
      <aside className="service-hero-aside" aria-label={`${categoryLabel} at a glance`}>
        <div className="service-aside-heading"><Icon size={29} aria-hidden="true" /><span>{group.number} / {categoryLabel}</span></div>
        <h2>{group.tagline}</h2>
        <div className="category-mini-list">{getOfferings(group.id).map(item => <a key={item.slug} href={offeringPath(item)}>{item.acronym ? `${item.acronym} Development` : item.shortTitle}<ArrowUpRight size={15} aria-hidden="true" /></a>)}</div>
      </aside>
    </ServiceHero>
    <section className="section container service-capabilities" id={`${group.id}-offerings`}>
      <div className="section-intro"><div><span className="eyebrow">{group.scopeLabel}</span><h2>{presentation.introduction}</h2></div><p>{presentation.note}</p></div>
      <OfferingCards items={getOfferings(group.id)} group={group} />
    </section>
    <section className="soft-section"><div className="section container"><div className="section-intro"><div><span className="eyebrow">THE NEXT STEPS</span><h2>How we work with you.</h2></div></div><Steps steps={group.process} /></div></section>
    <FAQs items={group.faqs} />
    <ContactBanner title={group.tagline} text={group.description} href={`/contact?category=${group.id}`} label="Contact us" />
  </main>
}

export function OfferingPage({ item, group }) {
  const presentation = offeringPresentation[`${item.group}/${item.slug}`]
  const peers = getOfferings(group.id).filter(peer => peer.slug !== item.slug)
  const faqs = [
    [`Who is this ${group.id === 'training' ? 'course' : 'service'} for?`, item.audience],
    ['What should I know before getting started?', item.preparation],
    ['What should I include in my enquiry?', `Useful details include: ${item.enquiry.join('; ')}.`],
    group.faqs[group.id === 'training' ? 1 : group.id === 'consulting' ? 2 : 0],
  ]
  return <main id="main-content" className={`internal-page offering-page internal-${group.id} theme-${group.accent}`}>
    <ServiceHero
      breadcrumbs={[{ label: group.title, href: `/${group.id}` }, { label: item.title }]}
      label={`${group.title}${item.acronym ? ` / ${item.acronym}` : ''}`}
      headline={item.title}
      description={item.summary}
      href={enquiryPath(item)}
      actionLabel={group.id === 'training' ? 'Enquire about this course' : 'Discuss this service'}
      secondaryHref="#scope" secondaryLabel="Explore the scope"
      visual={<PagePhoto name={presentation.photo} caption={presentation.caption} priority />}
    />
    <div className="container detail-layout"><div className="detail-content">
      <section className="detail-section"><span className="eyebrow">OVERVIEW</span><h2>{presentation.overview}</h2><p className="lead">{item.intro}</p><div className="audience-box"><strong>Who it’s for</strong><p>{item.audience}</p></div></section>
      <section className="detail-section" id="scope"><span className="eyebrow">THE SCOPE</span><h2>{group.detailLabel}</h2><ul className="scope-list capability-scope">{item.scope.map((text, index) => <li key={text}><span>{String(index + 1).padStart(2, '0')}</span><p>{text}</p></li>)}</ul></section>
      <section className="detail-section"><span className="eyebrow">{group.id === 'training' ? 'CONNECT THEORY TO PRACTICE' : 'FROM REQUIREMENT TO ACTION'}</span><h2>{group.id === 'training' ? 'A practical learning example.' : 'An example of the work.'}</h2><p>{item.practical}</p><TopicJourney presentation={presentation} training={group.id === 'training'} /><div className="preparation-note"><strong>{group.id === 'training' ? 'Before you begin' : 'Plan the scope together'}</strong><p>{item.preparation}</p></div></section>
      <section className="detail-section"><h2>{group.resultLabel}</h2><ul className="check-list">{item.results.map(text => <li key={text}><Check size={19} aria-hidden="true" />{text}</li>)}</ul></section>
    </div><aside className="enquiry-sidebar" aria-label="Enquiry information">
      <div className={`enquiry-card accent-${group.accent}`}><span className="eyebrow">LET’S TALK ABOUT IT</span><h2>Your next step.</h2><p>{group.id === 'training' ? 'Ask about the current syllabus, prerequisites, batch availability, delivery format, and fees.' : 'Share a little context so we can discuss the right scope and next steps.'}</p><strong>Useful details to share</strong><ul>{item.enquiry.map(text => <li key={text}>{text}</li>)}</ul><a className="button button-green" href={enquiryPath(item)}>Enquire about this {group.id === 'training' ? 'course' : 'service'}<ArrowUpRight size={17} aria-hidden="true" /></a></div>
      <nav className="sibling-nav" aria-label={`More ${group.title.toLowerCase()}`}><span className="eyebrow">MORE IN {group.title.toUpperCase()}</span>{peers.map(peer => <a key={peer.slug} href={offeringPath(peer)}>{peer.acronym ? `${peer.acronym} Development` : peer.shortTitle}<ArrowRight size={16} aria-hidden="true" /></a>)}<a href={`/${group.id}`}><ArrowLeft size={16} aria-hidden="true" />All {group.title.toLowerCase()}</a></nav>
    </aside></div>
    <FAQs items={faqs} />
    <ContactBanner title={group.id === 'training' ? 'Ready to take the next step?' : 'Let’s discuss your requirements.'} text={`Start a conversation about ${item.title.toLowerCase()}.`} href={enquiryPath(item)} label="Contact us" />
  </main>
}
