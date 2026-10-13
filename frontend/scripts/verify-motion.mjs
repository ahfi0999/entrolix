import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { readFile } from 'node:fs/promises'
import { createElement, act, StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { createServer } from 'vite'
import { JSDOM } from 'jsdom'
import { installSiteMotion } from '../src/motion.js'

// Simulated browser primitives exercise lifecycle behavior, not visual rendering.
function environment(html = '<div id="root"></div>') {
  const dom = new JSDOM(`<!doctype html><html><head><title>Entrolix</title></head><body>${html}</body></html>`, { url: 'http://localhost/', pretendToBeVisual: true })
  const { window } = dom
  const { document } = window
  const media = new Map()
  const observers = []
  const sizes = []
  const animations = []
  const frames = new Map()
  let sequence = 0
  window.matchMedia = query => {
    if (!media.has(query)) {
      const listeners = new Set()
      media.set(query, {
        matches: query.includes('pointer: fine'), listeners,
        addEventListener: (_, listener) => listeners.add(listener),
        removeEventListener: (_, listener) => listeners.delete(listener),
        emit(matches) { this.matches = matches; [...listeners].forEach(listener => listener({ matches })) },
      })
    }
    return media.get(query)
  }
  window.IntersectionObserver = class {
    constructor(callback, options) { Object.assign(this, { callback, options, targets: new Set(), disconnected: false }); observers.push(this) }
    observe(target) { this.targets.add(target) }
    unobserve(target) { this.targets.delete(target) }
    disconnect() { this.targets.clear(); this.disconnected = true }
    emit(target, isIntersecting) { this.callback([{ target, isIntersecting }]) }
  }
  window.ResizeObserver = class {
    constructor(callback) { this.callback = callback; this.disconnected = false; sizes.push(this) }
    observe() {}
    disconnect() { this.disconnected = true }
  }
  window.Element.prototype.animate = function (keyframes, options) {
    const animation = {
      element: this, keyframes, options, playState: 'running', cancelled: false,
      pause() { this.playState = 'paused' },
      play() { this.playState = 'running' },
      cancel() { this.cancelled = true; this.playState = 'idle'; this.oncancel?.() },
      finish() { this.playState = 'finished'; this.onfinish?.() },
    }
    animations.push(animation)
    return animation
  }
  window.requestAnimationFrame = callback => { const id = ++sequence; frames.set(id, callback); return id }
  window.cancelAnimationFrame = id => frames.delete(id)
  window.HTMLElement.prototype.scrollIntoView = function () {}
  const flushFrames = () => { const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback(0)) }
  const point = (element, pointerType = 'mouse') => {
    const event = new window.MouseEvent('pointermove', { clientX: 380, clientY: 1280 })
    Object.defineProperty(event, 'pointerType', { value: pointerType })
    element.dispatchEvent(event)
  }
  return { dom, window, document, media, observers, sizes, animations, frames, flushFrames, point }
}

const fixture = environment(`<div id="motion" data-motion="full">
  <span data-reveal="line" data-reveal-delay="80" id="line">Build skills.</span>
  <article class="offering-card" data-tilt id="card"><a href="/training">Explore</a></article>
  <article class="offering-card" id="keyboard"><a href="/contact">Enquire</a></article>
  <div data-motion-scene id="scene"></div>
  <div class="faq-list"><details><summary>Question</summary><p>Answer</p></details></div>
</div>`)
const { window, document, observers, animations, frames, flushFrames, point } = fixture
const root = document.getElementById('motion')
const line = document.getElementById('line')
const card = document.getElementById('card')
const keyboard = document.getElementById('keyboard')
const scene = document.getElementById('scene')
const rect = top => ({ top, bottom: top + 200, left: 0, right: 400, width: 400, height: 200 })
line.getBoundingClientRect = () => rect(50)
card.getBoundingClientRect = keyboard.getBoundingClientRect = () => rect(1200)
Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })
Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, configurable: true })
const dispose = installSiteMotion(root)
assert.equal(animations[0].options.delay, 80)
assert.equal(animations[0].keyframes[0].translate, '0 105%')
assert.ok(card.classList.contains('motion-pending'))
const revealObserver = observers.find(observer => observer.options.rootMargin)
revealObserver.emit(card, true)
assert.ok(!card.classList.contains('motion-pending'))
const count = animations.length
revealObserver.emit(card, true)
assert.equal(animations.length, count, 'Each reveal plays once')
keyboard.querySelector('a').focus()
assert.ok(!keyboard.classList.contains('motion-pending'), 'Keyboard focus reveals immediately')
assert.equal(animations.length, count, 'Focused content never animates away')
console.log('PASS reveals: stagger, one-shot entrance, keyboard fail-open')

for (let i = 0; i < 25; i++) point(card)
assert.equal(frames.size, 1, 'Pointer updates coalesce into one frame')
flushFrames()
assert.equal(card.dataset.pointerActive, 'true')
assert.ok(Number.parseFloat(card.style.getPropertyValue('--tilt-y')) <= 2.5)
card.dispatchEvent(new window.Event('pointerleave'))
assert.equal(card.dataset.pointerActive, undefined)
assert.equal(card.style.getPropertyValue('--tilt-y'), '')
point(card, 'touch')
assert.equal(frames.size, 0, 'Touch never triggers tilt')
const pointerMedia = window.matchMedia('(hover: hover) and (pointer: fine)')
pointerMedia.emit(false)
point(card)
assert.equal(frames.size, 0, 'Coarse-pointer change removes listeners')
pointerMedia.emit(true)
console.log('PASS pointer effects: bounded tilt, frame batching, leave reset, no touch/coarse tilt')

Object.defineProperty(window, 'scrollY', { value: 600, configurable: true })
for (let i = 0; i < 20; i++) window.dispatchEvent(new window.Event('scroll'))
assert.equal(frames.size, 1)
flushFrames()
assert.equal(root.style.getPropertyValue('--reading-progress'), '0.5')
assert.equal(root.dataset.scrolled, 'true')
const sceneObserver = observers.find(observer => !observer.options.rootMargin)
sceneObserver.emit(scene, false)
assert.equal(scene.dataset.sceneActive, 'false')
Object.defineProperty(document, 'hidden', { value: true, configurable: true })
document.dispatchEvent(new window.Event('visibilitychange'))
assert.equal(root.dataset.motionSuspended, 'true')
assert.ok(animations.every(animation => animation.playState === 'paused'))
Object.defineProperty(document, 'hidden', { value: false, configurable: true })
document.dispatchEvent(new window.Event('visibilitychange'))
assert.ok(animations.every(animation => animation.playState === 'running'))
flushFrames()
const details = document.querySelector('details')
details.open = true
details.dispatchEvent(new window.Event('toggle'))
assert.equal(animations.at(-1).element.tagName, 'P')
dispose()
assert.ok(animations.every(animation => animation.cancelled))
assert.ok(observers.every(observer => observer.disconnected))
assert.ok(fixture.sizes.every(observer => observer.disconnected))
assert.equal(pointerMedia.listeners.size, 0)
assert.equal(frames.size, 0)
assert.equal(root.querySelectorAll('.motion-pending').length, 0)
assert.equal(root.style.getPropertyValue('--reading-progress'), '')
window.dispatchEvent(new window.Event('scroll'))
point(card)
assert.equal(frames.size, 0, 'No orphaned listeners or frame loops after cleanup')
window.IntersectionObserver = undefined
window.Element.prototype.animate = undefined
const stopFallback = installSiteMotion(root)
assert.equal(root.querySelectorAll('.motion-pending').length, 0)
stopFallback()
fixture.dom.window.close()
console.log('PASS lifecycle: scroll progress, off-screen/background suspension, FAQ, cleanup, unsupported-API fallback')

const server = await createServer({
  root: fileURLToPath(new URL('../', import.meta.url)),
  server: { middlewareMode: true, watch: null, ws: false },
  optimizeDeps: { noDiscovery: true, include: [] },
  appType: 'custom',
})
try {
  const { default: App } = await server.ssrLoadModule('/src/App.jsx')
  const app = () => createElement(StrictMode, null, createElement(App, { initialPath: '/' }))
  const html = renderToString(app())
  assert.ok(html.includes('data-motion="static"'))
  assert.ok(!html.includes('motion-pending'), 'Static HTML never hides content')
  const env = environment(`<div id="root">${html}</div>`)
  globalThis.window = env.window
  globalThis.document = env.document
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const reduced = env.window.matchMedia('(prefers-reduced-motion: reduce)')
  reduced.matches = true
  const host = env.document.getElementById('root')
  const hydrationErrors = []
  let reactRoot
  await act(async () => { reactRoot = hydrateRoot(host, app(), { onRecoverableError: error => hydrationErrors.push(error.message) }) })
  assert.deepEqual(hydrationErrors, [])
  const shell = () => env.document.querySelector('.site-shell')
  assert.equal(env.document.querySelector('.motion-toggle'), null, 'Play/pause UI is removed')
  const storedPreference = value => {
    env.window.localStorage.setItem('entrolix-motion', value)
    env.window.dispatchEvent(new env.window.StorageEvent('storage', { key: 'entrolix-motion', newValue: value }))
  }
  assert.equal(shell().dataset.motion, 'reduced')
  assert.equal(env.observers.length, 0, 'OS reduced-motion skips animation setup')
  await act(async () => reduced.emit(false))
  assert.equal(shell().dataset.motion, 'full')
  await act(async () => storedPreference('paused'))
  assert.equal(shell().dataset.motion, 'reduced')
  assert.equal(env.window.localStorage.getItem('entrolix-motion'), 'paused')
  assert.ok(env.observers.every(observer => observer.disconnected))
  await act(async () => reactRoot.unmount())
  reactRoot = createRoot(host)
  await act(async () => reactRoot.render(app()))
  assert.equal(shell().dataset.motion, 'reduced', 'Pause preference survives navigation/remount')
  await act(async () => storedPreference('enabled'))
  assert.equal(shell().dataset.motion, 'full')
  await act(async () => reduced.emit(true))
  assert.equal(shell().dataset.motion, 'reduced', 'System change stops effects immediately')
  await act(async () => reactRoot.unmount())
  assert.ok([...env.media.values()].every(query => query.listeners.size === 0), 'StrictMode cleans up subscriptions')
  Object.defineProperty(env.window, 'localStorage', { get() { throw new Error('Storage blocked') }, configurable: true })
  reduced.matches = false
  reactRoot = createRoot(host)
  await act(async () => reactRoot.render(app()))
  assert.equal(shell().dataset.motion, 'full', 'Animation setup tolerates blocked storage')
  await act(async () => reduced.emit(true))
  assert.equal(shell().dataset.motion, 'reduced', 'Device reduced-motion works when storage is unavailable')
  await act(async () => reactRoot.unmount())
  env.dom.window.close()
  const css = await readFile(new URL('../src/motion.css', import.meta.url), 'utf8')
  assert.ok(css.includes('@media (prefers-reduced-motion: reduce)'))
  assert.ok(css.includes('animation-play-state: paused !important'))
  console.log('PASS preferences: no play/pause UI, hydration, OS changes, saved preferences, StrictMode cleanup, blocked storage')
} finally {
  await server.close()
}
