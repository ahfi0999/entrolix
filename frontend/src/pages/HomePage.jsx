import HomeHero from './HomeHero'
import HomeExpertise from './HomeExpertise'
import HomeWhy from './HomeWhy'
import HomeProcess from './HomeProcess'

export default function HomePage() {
  return <main id="main-content" className="home-page"><HomeHero />
    <HomeExpertise />
    <HomeWhy />
    <HomeProcess />
  </main>
}
