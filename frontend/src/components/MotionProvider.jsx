import { useEffect, useRef, useState } from 'react'
import { installSiteMotion } from '../motion'

const preferenceKey = 'entrolix-motion'

export function MotionProvider({ children, pageKey }) {
  const root = useRef(null)
  const [preferences, setPreferences] = useState({ ready: false, paused: false, reduced: false })
  const enabled = preferences.ready && !preferences.paused && !preferences.reduced

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    let paused = false
    try { paused = window.localStorage.getItem(preferenceKey) === 'paused' } catch { /* Storage is optional. */ }
    setPreferences({ ready: true, paused, reduced: Boolean(media?.matches) })
    const updateSystem = event => setPreferences(current => ({ ...current, reduced: event.matches }))
    const updateStorage = event => {
      if (event.key === preferenceKey || event.key === null) {
        setPreferences(current => ({ ...current, paused: event.newValue === 'paused' }))
      }
    }
    media?.addEventListener?.('change', updateSystem)
    window.addEventListener('storage', updateStorage)
    return () => {
      media?.removeEventListener?.('change', updateSystem)
      window.removeEventListener('storage', updateStorage)
    }
  }, [])

  useEffect(() => {
    if (enabled && root.current) return installSiteMotion(root.current)
  }, [enabled, pageKey])

  return <div ref={root} className="site-shell" data-motion={!preferences.ready ? 'static' : enabled ? 'full' : 'reduced'}>
    <div className="reading-progress" aria-hidden="true"><span /></div>
    {children}
  </div>
}
