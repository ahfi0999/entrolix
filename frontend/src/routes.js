import { getGroup, offerings, offeringPath, serviceGroups } from './catalog'

export const normalizePath = value => (value.split('?')[0].replace(/\/+$/, '') || '/')
const fixedPages = {
  '/': { type: 'home', title: 'Entrolix | Training, IT Consulting & Recruitment', description: 'Build skills, create solutions, and find talent with Entrolix. Explore technology training, ServiceNow and custom software consulting, and staffing services.' },
  '/services': { type: 'services', title: 'Our Services | Entrolix', description: 'Explore Entrolix Training, IT Consulting, and Recruitment. Find the right learning path, custom business solution, or staffing service.' },
  '/about': { type: 'about', title: 'About Entrolix | Skills, Technology & People', description: 'Get to know Entrolix, our beliefs, vision, and mission. We bring training, IT consulting, and recruitment together to help people and businesses move forward.' },
  '/contact': { type: 'contact', title: 'Contact Entrolix | Training, Consulting & Hiring Enquiries', description: 'Contact info@entrolix.com for technology training, ServiceNow implementation and support, custom business systems, and recruitment enquiries.' },
}
export const pagePaths = [...Object.keys(fixedPages), ...serviceGroups.map(group => `/${group.id}`), ...offerings.map(offeringPath)]
export function resolveRoute(path) {
  const pathname = normalizePath(path)
  if (fixedPages[pathname]) return { ...fixedPages[pathname], pathname }
  const group = serviceGroups.find(item => pathname === `/${item.id}`)
  if (group) return { type: 'category', group, pathname, title: `${group.title} | Entrolix`, description: group.description }
  const item = offerings.find(item => offeringPath(item) === pathname)
  if (item) return { type: 'offering', item, group: getGroup(item.group), pathname, title: `${item.title} | Entrolix`, description: item.summary }
  return { type: 'not-found', pathname, title: 'Page not found | Entrolix', description: 'Explore Entrolix training, consulting, and recruitment services.' }
}
