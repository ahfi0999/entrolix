import { ArrowRight } from 'lucide-react'
import { serviceGroups } from '../catalog'

// Presentation copy is grounded in the existing service catalog, not new offerings.
const expertise = {
  training: {
    title: 'Training Services', label: 'Practical learning', cta: 'Explore Training',
    description: 'Industry-focused training in ServiceNow, AI, data science, and software testing, with guided practice for real-world applications.',
    image: '/images/expertise-training-hd-v2.jpg',
    srcSet: '/images/expertise-training-hd-v2-640.jpg 640w, /images/expertise-training-hd-v2.jpg 1448w',
    width: 1448, height: 1086,
    alt: 'A hand holding a glowing graduation-cap hologram above a blue city skyline',
  },
  consulting: {
    title: 'IT Solutions', label: 'Thoughtful technology', cta: 'Explore IT Solutions',
    description: 'ServiceNow implementation and support, alongside custom business applications designed around your people, processes, and requirements.',
    image: '/images/expertise-it-hd-v2.jpg',
    srcSet: '/images/expertise-it-hd-v2-640.jpg 640w, /images/expertise-it-hd-v2.jpg 1448w',
    width: 1448, height: 1086,
    alt: 'A glowing IT interface connected to technology, automation and computing icons',
  },
  recruitment: {
    title: 'Recruitment', label: 'Meaningful connections', cta: 'Explore Recruitment',
    description: 'Permanent, temporary, and IT staffing that connects organizations with suitable talent through focused search, screening, and hiring coordination.',
    image: '/images/expertise-recruitment-hd-v2.jpg',
    srcSet: '/images/expertise-recruitment-hd-v2-640.jpg 640w, /images/expertise-recruitment-hd-v2.jpg 1448w',
    width: 1448, height: 1086,
    alt: 'Connected cyan candidate profiles projected above a desk in a modern office',
  },
}

export default function HomeExpertise() {
  return <section id="services" className="entrolix-expertise" aria-labelledby="expertise-title">
    <div className="entrolix-expertise__inner">
      <header className="entrolix-expertise__intro" data-reveal>
        <div>
          <p className="entrolix-expertise__eyebrow">WHAT WE DO</p>
          <h2 id="expertise-title" className="entrolix-expertise__title">Three capabilities.<br /><span>One partner.</span></h2>
        </div>
        <p className="entrolix-expertise__summary">From developing technical skills to delivering technology solutions and connecting talent with opportunity, explore how Entrolix supports professional and business growth.</p>
      </header>
      <div className="entrolix-expertise__grid">
        {serviceGroups.map(({ id, number }) => {
          const service = expertise[id]
          return <article className={`entrolix-expertise__service entrolix-expertise__service--${id}`} key={id} aria-labelledby={`expertise-${id}-title`} data-reveal>
            <p className="entrolix-expertise__label"><span aria-hidden="true">{number}</span>{service.label}</p>
            <div className="entrolix-expertise__image">
              <img src={service.image} srcSet={service.srcSet}
                sizes="(max-width: 600px) calc(100vw - 40px), (max-width: 1040px) 40vw, (max-width: 1802px) 30vw, 510px"
                width={service.width} height={service.height} alt={service.alt} loading="lazy" decoding="async" />
            </div>
            <h3 id={`expertise-${id}-title`} className="entrolix-expertise__service-title">{service.title}</h3>
            <p className="entrolix-expertise__description">{service.description}</p>
            <a className="entrolix-expertise__link" href={`/${id}`}>{service.cta}<ArrowRight size={19} strokeWidth={1.5} aria-hidden="true" /></a>
          </article>
        })}
      </div>
    </div>
  </section>
}
