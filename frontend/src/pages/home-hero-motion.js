// Local to the hero image; shared navigation and motion behavior stay unchanged.
export function installHeroParallax(scene) {
  const doc = scene?.ownerDocument
  const win = doc?.defaultView
  if (!win?.matchMedia || !win.requestAnimationFrame) return () => {}
  const media = win.matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)')
  const shell = scene.closest('[data-motion]')
  let enabled = false
  let frame = null
  let pointer = null
  const reset = () => {
    if (frame !== null) win.cancelAnimationFrame(frame)
    frame = null
    pointer = null
    scene.style.removeProperty('--hero-image-x')
    scene.style.removeProperty('--hero-image-y')
  }
  const sync = () => {
    enabled = media.matches && shell?.dataset.motion === 'full' && !doc.hidden
    scene.dataset.parallax = enabled ? 'enabled' : 'disabled'
    if (!enabled) reset()
  }
  const update = () => {
    frame = null
    if (!enabled || !pointer) return
    const rect = scene.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    const x = Math.max(-1, Math.min(1, ((pointer.x - rect.left) / rect.width - .5) * 2))
    const y = Math.max(-1, Math.min(1, ((pointer.y - rect.top) / rect.height - .5) * 2))
    scene.style.setProperty('--hero-image-x', `${(x * 6).toFixed(2)}px`)
    scene.style.setProperty('--hero-image-y', `${(y * 4).toFixed(2)}px`)
  }
  const move = event => {
    if (!enabled || event.pointerType !== 'mouse') return
    pointer = { x: event.clientX, y: event.clientY }
    if (frame === null) frame = win.requestAnimationFrame(update)
  }
  const listeners = []
  const listen = (target, type, handler, options) => {
    target?.addEventListener?.(type, handler, options)
    listeners.push(() => target?.removeEventListener?.(type, handler, options))
  }
  listen(scene, 'pointermove', move, { passive: true })
  listen(scene, 'pointerleave', reset)
  listen(scene, 'pointercancel', reset)
  listen(win, 'scroll', reset, { passive: true })
  listen(win, 'blur', reset)
  listen(doc, 'visibilitychange', sync)
  listen(media, 'change', sync)
  const observer = win.MutationObserver && shell ? new win.MutationObserver(sync) : null
  observer?.observe(shell, { attributes: true, attributeFilter: ['data-motion'] })
  sync()
  return () => {
    listeners.forEach(remove => remove())
    observer?.disconnect()
    reset()
    delete scene.dataset.parallax
  }
}
