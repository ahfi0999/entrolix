import { ArrowRight } from 'lucide-react'

// A plain-language summary of the service-specific processes in catalog.js.
// Exact activities and commitments depend on the service and agreed scope.
const steps = [
  {
    title: 'Understand',
    description: 'Share your learning goals, business requirements, or hiring needs. Start with your current situation and what you want to achieve.',
  },
  {
    title: 'Plan',
    description: 'Discuss the right learning path, technology priorities, or role requirements. Agree on the scope and practical next steps before work begins.',
  },
  {
    title: 'Deliver',
    description: 'Put the agreed plan into practice through guided training, technology work, or candidate search and interview coordination.',
  },
  {
    title: 'Move Forward',
    description: 'Review progress and discuss what comes next: further learning, handover and support, or offer and joining coordination, as appropriate.',
  },
]

export default function HomeProcess() {
  return <section id="process" className="entrolix-process" aria-labelledby="process-title">
    <div className="entrolix-process__inner">
      <header className="entrolix-process__intro" data-reveal>
        <div>
          <p className="entrolix-process__eyebrow">OUR APPROACH</p>
          <h2 id="process-title" className="entrolix-process__title">Good work starts<br />with understanding.</h2>
        </div>
        <div className="entrolix-process__context">
          <p className="entrolix-process__summary">Every requirement is different. We begin by understanding the need, identifying the right approach, and working toward a solution that fits the goal.</p>
          <p className="entrolix-process__scope">The details are shaped around your service and agreed scope.</p>
        </div>
      </header>
      <ol className="entrolix-process__journey" role="list" aria-label="How we work together">
        {steps.map(({ title, description }, index) => <li className="entrolix-process__step" key={title} data-reveal data-reveal-delay={index * 60}>
          <span className="entrolix-process__number" aria-hidden="true">0{index + 1}</span>
          <div className="entrolix-process__step-copy"><h3>{title}</h3><p>{description}</p></div>
        </li>)}
      </ol>
      <div className="entrolix-process__invitation" data-reveal>
        <div><h3>Have a requirement in mind?</h3><p>Let’s discuss what you’re looking to achieve.</p></div>
        <a className="entrolix-process__contact" href="/contact">Talk to Our Team<ArrowRight size={20} strokeWidth={1.5} aria-hidden="true" /></a>
      </div>
    </div>
  </section>
}
