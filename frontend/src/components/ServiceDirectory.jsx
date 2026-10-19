import { getOfferings, offeringPath, serviceGroups } from '../catalog'

export default function ServiceDirectory() {
  return <nav id="service-directory" className="entrolix-directory" aria-label="Service directory">
    {serviceGroups.map(group => <div className="entrolix-directory__group" key={group.id}>
      <h3 className="entrolix-directory__heading" id={`directory-${group.id}`}>{group.title}</h3>
      <ul className="entrolix-directory__links" role="list" aria-labelledby={`directory-${group.id}`}>
        {getOfferings(group.id).map(item => <li key={item.slug}>
          <a href={offeringPath(item)}>{item.acronym ? `${item.acronym} Development` : item.shortTitle}</a>
        </li>)}
      </ul>
    </div>)}
  </nav>
}
