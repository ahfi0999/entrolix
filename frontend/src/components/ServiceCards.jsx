import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { getOfferings, offeringPath, serviceGroups } from '../catalog'

export function PillarCards() {
  return <div className="pillar-grid">{serviceGroups.map(({ id, title, icon: Icon, number, accent, description, audience }) => <article key={id} className={`pillar-card accent-${accent}`}>
    <div className="card-top"><span className="icon-tile"><Icon size={26} aria-hidden="true" /></span><span className="card-number">{number}</span></div>
    <span className="card-kicker">{audience}</span><h3><a href={`/${id}`}>{title}<ArrowUpRight size={24} aria-hidden="true" /></a></h3><p>{description}</p>
    <ul className="pillar-links">{getOfferings(id).map(item => <li key={item.slug}><a href={offeringPath(item)}>{item.acronym ? `${item.acronym} Development` : item.shortTitle}<ArrowRight size={15} aria-hidden="true" /></a></li>)}</ul>
    <a className="text-link card-overview" href={`/${id}`}>Explore {title.toLowerCase()}<ArrowRight size={17} aria-hidden="true" /></a>
  </article>)}</div>
}

export function OfferingCards({ items, group }) {
  return <div className="offering-grid">{items.map((item, index) => <article className="offering-card" key={item.slug}>
    <div className="card-top"><span className={`category-chip accent-${group.accent}`}>{item.acronym || group.title}</span><span className="card-number">{String(index + 1).padStart(2, '0')}</span></div>
    <h3><a href={offeringPath(item)}>{item.shortTitle}</a></h3><p>{item.summary}</p><a className="text-link" href={offeringPath(item)}>Explore {group.id === 'training' ? 'training' : 'service'}<ArrowUpRight size={18} aria-hidden="true" /></a>
  </article>)}</div>
}
