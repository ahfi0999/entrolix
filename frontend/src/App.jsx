import { useEffect } from 'react'
import { ArrowRight } from 'lucide-react'
import AboutPage from './AboutPage'
import HomePage from './pages/HomePage'
import ContactPage from './pages/ContactPage'
import { CategoryPage, OfferingPage, ServicesOverview } from './pages/ServicePages'
import { Footer, Header, StaticNavigation } from './components/SiteLayout'
import { resolveRoute } from './routes'
import { MotionProvider } from './components/MotionProvider'

export default function App({ initialPath }) {
  const pathname = initialPath || (typeof window === 'undefined' ? '/' : window.location.pathname)
  const route = resolveRoute(pathname)

  useEffect(() => {
    document.title = route.title
    document.querySelector('meta[name="description"]')?.setAttribute('content', route.description)
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', route.title)
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', route.description)
    document.querySelector('meta[name="robots"]')?.setAttribute('content', route.type === 'not-found' ? 'noindex,follow' : 'index,follow')
    const legacy = {
      development: '/consulting/servicenow-implementation',
      'managed-support': '/consulting/servicenow-support',
      'automation-integration': '/consulting',
      'ai-agents': '/training/ai',
    }
    const hash = window.location.hash.slice(1)
    if (route.pathname === '/services' && legacy[hash]) {
      window.location.replace(legacy[hash])
      return
    }
    const target = document.getElementById(hash === 'work' ? 'process' : hash)
    if (target) target.scrollIntoView({ behavior: 'instant', block: 'start' })
  }, [route.title, route.description, route.type, route.pathname])

  let page
  switch (route.type) {
    case 'home': page = <HomePage />; break
    case 'services': page = <ServicesOverview />; break
    case 'category': page = <CategoryPage group={route.group} />; break
    case 'offering': page = <OfferingPage item={route.item} group={route.group} />; break
    case 'about': page = <AboutPage />; break
    case 'contact': page = <ContactPage />; break
    default: page = <main id="main-content" className="container not-found"><span className="eyebrow">404 / PAGE NOT FOUND</span><h1>Let’s get you<br /><em>back on track.</em></h1><p>The page you’re looking for isn’t here. Explore our training, consulting, and recruitment services.</p><a className="button button-dark" href="/services">Explore services<ArrowRight size={18} aria-hidden="true" /></a></main>
  }
  return <MotionProvider pageKey={route.pathname}><a className="skip-link" href="#main-content">Skip to content</a><Header pathname={route.pathname} /><StaticNavigation />{page}<Footer /></MotionProvider>
}
