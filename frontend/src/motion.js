// Progressive enhancement: readable HTML first, motion only after hydration.
// No scroll hijacking, animation dependency, or continuously running JS loop.
const revealSelector = [
  '[data-reveal]', '.page-hero > .eyebrow', '.page-hero > h1',
  '.page-hero > .hero-description', '.page-hero > .hero-actions',
  '.category-hero-layout > div:first-child > *', '.category-hero-card',
  '.section-intro', '.pillar-card', '.offering-card', '.steps-grid > li',
  '.home-about > div', '.detail-section', '.enquiry-card', '.sibling-nav',
  '.faq-layout > div:first-child', '.faq-list > details',
  '.contact-banner-inner > *', '.footer-top > *', '.about-hero-bottom',
  '.about-manifesto', '.about-pillar', '.company-story > div', '.belief-card',
  '.direction-card', '.company-why > div', '.company-why-list > li',
  '.company-closing .container', '.contact-info', '.enquiry-form-panel',
].join(', ')

export function installSiteMotion(root) {
  const doc = root.ownerDocument
  const win = doc.defaultView
  const cleanups = []
  const animations = new Set()
  const reveals = new Map()
  const played = new WeakSet()
  const targets = [...root.querySelectorAll(revealSelector)]
  let scrollFrame = null

  const listen = (target, type, handler, options) => {
    target.addEventListener(type, handler, options)
    cleanups.push(() => target.removeEventListener(type, handler, options))
  }
  const animate = (element, frames, options) => {
    if (typeof element.animate !== 'function') return null
    const animation = element.animate(frames, options)
    animations.add(animation)
    const release = () => {
      animations.delete(animation)
      if (reveals.get(element) === animation) reveals.delete(element)
    }
    animation.onfinish = release
    animation.oncancel = release
    if (doc.hidden) animation.pause()
    return animation
  }

  let revealObserver
  const reveal = (element, immediate = false) => {
    element.classList.remove('motion-pending')
    revealObserver?.unobserve(element)
    if (played.has(element)) return
    played.add(element)
    if (immediate || element.contains(doc.activeElement)) return
    const siblings = [...element.parentElement.children].filter(node => node.matches(revealSelector))
    const delay = Number(element.dataset.revealDelay) || Math.min(siblings.indexOf(element), 3) * 75
    const isLine = element.dataset.reveal === 'line'
    const animation = animate(element, [
      { opacity: isLine ? 0.4 : 0, translate: isLine ? '0 105%' : '0 26px' },
      { opacity: 1, translate: '0 0' },
    ], { duration: isLine ? 950 : 700, delay, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' })
    if (animation) reveals.set(element, animation)
  }

  // Never hide content if observers or native animation are unavailable.
  if (win.IntersectionObserver && win.Element.prototype.animate) {
    revealObserver = new win.IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) reveal(entry.target) })
    }, { threshold: 0, rootMargin: '0px 0px -24px 0px' })
    for (const element of targets) {
      const rect = element.getBoundingClientRect()
      if (rect.bottom <= 0) played.add(element)
      else if (rect.top < win.innerHeight - 24) reveal(element)
      else {
        element.classList.add('motion-pending')
        revealObserver.observe(element)
      }
    }
    cleanups.push(() => revealObserver.disconnect())
  }

  // A keyboard user must never tab into transparent or moving content.
  listen(root, 'focusin', event => {
    for (const element of targets) {
      if (element.contains(event.target)) {
        reveals.get(element)?.cancel()
        reveal(element, true)
      }
    }
  })

  const scenes = [...root.querySelectorAll('[data-motion-scene]')]
  if (win.IntersectionObserver) {
    const sceneObserver = new win.IntersectionObserver(entries => {
      entries.forEach(entry => { entry.target.dataset.sceneActive = String(entry.isIntersecting) })
    }, { threshold: 0 })
    scenes.forEach(scene => sceneObserver.observe(scene))
    cleanups.push(() => sceneObserver.disconnect())
  }

  const updateScroll = () => {
    scrollFrame = null
    const distance = Math.max(0, doc.documentElement.scrollHeight - win.innerHeight)
    const progress = distance ? Math.min(1, Math.max(0, win.scrollY / distance)) : 0
    root.style.setProperty('--reading-progress', String(progress))
    root.dataset.scrolled = String(win.scrollY > 24)
  }
  const queueScroll = () => {
    if (win.requestAnimationFrame && scrollFrame === null && !doc.hidden) scrollFrame = win.requestAnimationFrame(updateScroll)
  }
  if (win.requestAnimationFrame) {
    listen(win, 'scroll', queueScroll, { passive: true })
    listen(win, 'resize', queueScroll, { passive: true })
    if (win.ResizeObserver) {
      const sizeObserver = new win.ResizeObserver(queueScroll)
      sizeObserver.observe(root)
      cleanups.push(() => sizeObserver.disconnect())
    }
    updateScroll()
  }

  const pointerCleanups = []
  const pointerResets = []
  const finePointer = win.matchMedia?.('(hover: hover) and (pointer: fine)')
  const clearPointers = () => {
    pointerResets.splice(0).forEach(reset => reset())
    pointerCleanups.splice(0).forEach(cleanup => cleanup())
  }
  const configurePointers = () => {
    clearPointers()
    if (!finePointer?.matches || !win.requestAnimationFrame) return
    root.querySelectorAll('[data-tilt]').forEach(element => {
      let frame = null
      let pointer = null
      const reset = () => {
        if (frame !== null) win.cancelAnimationFrame(frame)
        frame = null
        pointer = null
        delete element.dataset.pointerActive
        for (const name of ['--tilt-x', '--tilt-y', '--spotlight-x', '--spotlight-y']) element.style.removeProperty(name)
      }
      const update = () => {
        frame = null
        if (!pointer) return
        const rect = element.getBoundingClientRect()
        if (!rect.width || !rect.height) return
        const x = Math.max(0, Math.min(1, (pointer.x - rect.left) / rect.width))
        const y = Math.max(0, Math.min(1, (pointer.y - rect.top) / rect.height))
        element.style.setProperty('--tilt-x', `${((0.5 - y) * 5).toFixed(2)}deg`)
        element.style.setProperty('--tilt-y', `${((x - 0.5) * 5).toFixed(2)}deg`)
        element.style.setProperty('--spotlight-x', `${(x * 100).toFixed(1)}%`)
        element.style.setProperty('--spotlight-y', `${(y * 100).toFixed(1)}%`)
        element.dataset.pointerActive = 'true'
      }
      const move = event => {
        if (event.pointerType === 'touch' || doc.hidden) return
        pointer = { x: event.clientX, y: event.clientY }
        if (frame === null) frame = win.requestAnimationFrame(update)
      }
      element.addEventListener('pointermove', move, { passive: true })
      element.addEventListener('pointerleave', reset)
      element.addEventListener('pointercancel', reset)
      pointerResets.push(reset)
      pointerCleanups.push(() => {
        element.removeEventListener('pointermove', move)
        element.removeEventListener('pointerleave', reset)
        element.removeEventListener('pointercancel', reset)
      })
    })
  }
  configurePointers()
  if (finePointer?.addEventListener) listen(finePointer, 'change', configurePointers)
  listen(win, 'blur', () => pointerResets.forEach(reset => reset()))

  listen(root, 'toggle', event => {
    if (!event.target.matches('.faq-list details') || !event.target.open) return
    const answer = event.target.querySelector('p')
    if (answer) animate(answer, [{ opacity: 0, translate: '0 -6px' }, { opacity: 1, translate: '0 0' }], { duration: 260, easing: 'ease-out' })
  }, true)

  const syncVisibility = () => {
    root.dataset.motionSuspended = String(doc.hidden)
    for (const animation of animations) {
      if (doc.hidden) animation.pause()
      else if (animation.playState === 'paused') animation.play()
    }
    if (doc.hidden) {
      pointerResets.forEach(reset => reset())
      if (scrollFrame !== null) win.cancelAnimationFrame(scrollFrame)
      scrollFrame = null
    } else queueScroll()
  }
  listen(doc, 'visibilitychange', syncVisibility)
  root.dataset.motionSuspended = String(doc.hidden)

  return () => {
    cleanups.forEach(cleanup => cleanup())
    clearPointers()
    for (const animation of animations) animation.cancel()
    animations.clear()
    reveals.clear()
    if (scrollFrame !== null) win.cancelAnimationFrame(scrollFrame)
    targets.forEach(element => element.classList.remove('motion-pending'))
    scenes.forEach(scene => delete scene.dataset.sceneActive)
    root.style.removeProperty('--reading-progress')
    delete root.dataset.scrolled
    delete root.dataset.motionSuspended
  }
}
