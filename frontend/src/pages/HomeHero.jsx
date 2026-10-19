import { ArrowRight, GraduationCap, LaptopMinimal, UsersRound } from 'lucide-react'

const services = [
  { id: 'training', title: 'Training Services', description: 'Industry-relevant training for real-world careers.', icon: GraduationCap },
  { id: 'consulting', title: 'IT Solutions', description: 'Custom development, consulting and support.', icon: LaptopMinimal },
  { id: 'recruitment', title: 'Recruitment', description: 'Connecting the right talent with the right opportunities.', icon: UsersRound },
]

export default function HomeHero() {
  return <section className="entrolix-hero" aria-labelledby="entrolix-hero-title" data-motion-scene>
    <div className="entrolix-hero__visual" aria-hidden="true">
      <img className="entrolix-hero__photo"
        src="/images/entrolix-office-reference.jpg"
        srcSet="/images/entrolix-office-reference-960.jpg 960w, /images/entrolix-office-reference.jpg 1672w"
        sizes="100vw" width="1672" height="941" alt=""
        fetchPriority="high" decoding="async" />
    </div>
    <div className="entrolix-hero__layout">
      <div className="entrolix-hero__copy">
        <p className="entrolix-hero__eyebrow" data-reveal>TECHNOLOGY <span aria-hidden="true">·</span> TALENT <span aria-hidden="true">·</span> TRANSFORMATION</p>
        <h1 id="entrolix-hero-title" className="entrolix-hero__title">
          <span className="entrolix-hero__line"><span data-reveal="line" data-reveal-delay="60">Building Skills.</span></span>{' '}
          <span className="entrolix-hero__line"><span className="entrolix-hero__accent" data-reveal="line" data-reveal-delay="140">Engineering Solutions.</span></span>{' '}
          <span className="entrolix-hero__line"><span data-reveal="line" data-reveal-delay="220">Connecting Talent.</span></span>
        </h1>
        <p className="entrolix-hero__description" data-reveal data-reveal-delay="260">From industry-focused training to business technology solutions and recruitment, Entrolix helps organizations and professionals move forward.</p>
        <div className="entrolix-hero__actions" data-reveal data-reveal-delay="320">
          <a className="entrolix-hero__primary" href="/services">Explore Our Services<ArrowRight size={22} aria-hidden="true" /></a>
          <a className="entrolix-hero__secondary" href="/contact">Talk to Our Team<ArrowRight size={22} aria-hidden="true" /></a>
        </div>
      </div>
      <div className="entrolix-hero__constellation" aria-hidden="true">
        <svg className="entrolix-hero__orbits" viewBox="0 0 720 390" fill="none" focusable="false">
          <defs><linearGradient id="entrolix-orbit-gradient" x1="70" y1="30" x2="200" y2="350" gradientUnits="userSpaceOnUse"><stop stopColor="#448dff" /><stop offset=".5" stopColor="#8494ff" /><stop offset="1" stopColor="#e1efff" /></linearGradient></defs>
          <path d="M185 48 C156 -8 104 20 63 70 C-11 150 -12 209 42 260 C77 299 124 326 186 340" stroke="url(#entrolix-orbit-gradient)" strokeWidth="1.3" />
          <path d="M608 171 C650 180 685 209 707 257" stroke="#e1efff" strokeOpacity=".55" strokeWidth="1.2" />
          <circle cx="100" cy="37" r="6.5" fill="#419bff" /><circle cx="53" cy="87" r="6" fill="#658fff" /><circle cx="98" cy="303" r="3" fill="#e1efff" />
        </svg>
        {services.map(({ id, title, icon: Icon }) => <div className={`entrolix-hero__node entrolix-hero__node--${id}`} key={id}>
          <span className="entrolix-hero__node-icon"><Icon size={30} strokeWidth={1.5} /></span><span>{title}</span>
        </div>)}
      </div>
    </div>
    <nav className="entrolix-hero__services" aria-label="Explore Entrolix services" data-reveal data-reveal-delay="80">
      {services.map(({ id, title, description, icon: Icon }, index) => <a className="entrolix-hero__service" href={`/${id}`} key={id}>
        <span className="entrolix-hero__number" aria-hidden="true">0{index + 1}</span>
        <span className="entrolix-hero__service-icon"><Icon size={32} strokeWidth={1.6} aria-hidden="true" /></span>
        <div className="entrolix-hero__service-copy"><h2>{title}</h2><p>{description}</p></div>
      </a>)}
    </nav>
  </section>
}
