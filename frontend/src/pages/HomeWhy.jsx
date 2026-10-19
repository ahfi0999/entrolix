import { ArrowRight } from 'lucide-react'

// Grounded in company.js and the learning, consulting and staffing catalog.
// These describe our approach, not guaranteed outcomes or measured achievements.
const principles = [
  {
    title: 'Practical Learning',
    description: 'Connect concepts with guided practice in ServiceNow, AI, data science, and software testing. Start with your experience and the skills you want to develop.',
  },
  {
    title: 'Thoughtful Technology',
    description: 'Start with the people, processes, and requirements behind the work. Shape ServiceNow and custom business applications around those needs, with a clearly agreed scope.',
  },
  {
    title: 'Meaningful Connections',
    description: 'Understand the role before starting the search. Support employers and candidates through focused screening, interview coordination, and permanent, temporary, or IT staffing.',
  },
]

export default function HomeWhy() {
  return <section id="why-entrolix" className="entrolix-why" aria-labelledby="why-entrolix-title">
    <div className="entrolix-why__inner">
      <div className="entrolix-why__layout">
        <div className="entrolix-why__statement" data-reveal>
          <p className="entrolix-why__eyebrow">WHY ENTROLIX</p>
          <h2 id="why-entrolix-title" className="entrolix-why__title">
            <span>The right skills.</span>{' '}
            <span>The right solutions.</span>{' '}
            <span className="entrolix-why__accent">The right connections.</span>
          </h2>
          <p className="entrolix-why__summary">Progress begins with understanding the challenge. Entrolix brings together training, technology, and recruitment to help people and organizations move toward their goals.</p>
          <a className="entrolix-why__link" href="/about">Discover Our Approach<ArrowRight size={19} strokeWidth={1.5} aria-hidden="true" /></a>
        </div>
        <ol className="entrolix-why__principles" role="list" aria-label="The principles behind our work">
          {principles.map(({ title, description }, index) => <li className="entrolix-why__principle" key={title} data-reveal>
            <span className="entrolix-why__number" aria-hidden="true">0{index + 1}</span>
            <div className="entrolix-why__principle-copy">
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          </li>)}
        </ol>
      </div>
    </div>
  </section>
}
