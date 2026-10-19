import credits from '../../public/images/internal/credits.json'

export function PagePhoto({ name, caption, priority = false }) {
  const photo = credits.photos[name]
  return <figure className="internal-photo">
    <img src={`/images/internal/${name}-1200.webp`} srcSet={`/images/internal/${name}-600.webp 600w, /images/internal/${name}-1200.webp 1200w`} sizes="(max-width: 800px) calc(100vw - 40px), (max-width: 1440px) 44vw, 640px" width="1200" height="900" alt={photo.alt} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : undefined} decoding="async" />
    <figcaption><span>{caption}</span><small>Illustrative photograph</small></figcaption>
  </figure>
}

export function TopicJourney({ presentation, training = false }) {
  return <figure className="topic-journey">
    <figcaption><span className="eyebrow">{training ? 'A LEARNING EXAMPLE' : 'AN ILLUSTRATIVE WORKFLOW'}</span><h3>{presentation.heading}</h3></figcaption>
    <ol>{presentation.stages.map(([title, description], index) => <li key={title}><span className="topic-journey-number" aria-hidden="true">0{index + 1}</span><div><strong>{title}</strong><p>{description}</p></div></li>)}</ol>
  </figure>
}
