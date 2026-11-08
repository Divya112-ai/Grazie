import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import Lenis from 'lenis'
import { gsap, ScrollTrigger } from './lib/anim'
import { S } from './state'
import { detectWebGL, isFinePointer, isReducedMotion, isSmallScreen } from './lib/env'
import { IntroBack, IntroFront } from './components/Intro'
import Hero from './components/Hero'
import Journey from './components/Journey'
import Art from './components/Art'
import Collection from './components/Collection'
import Details from './components/Details'
import Message from './components/Message'
import Contact from './components/Contact'
import Cursor from './components/Cursor'
import Fallback from './components/Fallback'

const WorldCanvas = lazy(() => import('./three/WorldCanvas.jsx'))

class Boundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onFail?.()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

// ── one-time environment setup (before first paint) ──────────────────────────
S.reduced = isReducedMotion()
S.finePointer = isFinePointer() && !S.reduced
S.reveal = S.reduced ? 1 : 0
if (typeof document !== 'undefined') {
  const h = document.documentElement
  h.classList.toggle('anim', !S.reduced)
  h.classList.toggle('fine', S.finePointer)
  h.classList.add('locked')
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
}

export default function App() {
  const [webgl, setWebgl] = useState(() => detectWebGL())
  const [mode, setModeState] = useState('stage')
  const [ready, setReady] = useState(false)
  const [introOpen, setIntroOpen] = useState(true)
  const [entered, setEntered] = useState(false)
  const mobile = useRef(isSmallScreen() || !isFinePointer()).current

  const setMode = useCallback((m) => {
    S.mode = m
    setModeState(m)
  }, [])

  // ── smooth scrolling + pointer tracking ───────────────────────────────────
  useEffect(() => {
    window.scrollTo(0, 0)
    let lenis, tick
    if (!S.reduced) {
      lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95 })
      S.lenis = lenis
      lenis.on('scroll', ScrollTrigger.update)
      tick = (t) => lenis.raf(t * 1000)
      gsap.ticker.add(tick)
      gsap.ticker.lagSmoothing(0)
      lenis.stop()
    }
    const onMove = (e) => {
      S.mouse.x = (e.clientX / innerWidth) * 2 - 1
      S.mouse.y = -((e.clientY / innerHeight) * 2 - 1)
    }
    addEventListener('pointermove', onMove, { passive: true })
    return () => {
      removeEventListener('pointermove', onMove)
      if (lenis) {
        gsap.ticker.remove(tick)
        lenis.destroy()
      }
    }
  }, [])

  // ── scroll → scene wiring ─────────────────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({ trigger: '#hero', start: 'top top', end: 'bottom top', onUpdate: (s) => (S.hero = s.progress) })
      ScrollTrigger.create({ trigger: '#journey', start: 'top top', end: 'bottom bottom', onUpdate: (s) => (S.journey = s.progress) })
      // the canvas only renders where it is actually visible
      ScrollTrigger.create({
        trigger: '#art',
        start: 'top top',
        onEnter: () => setMode('off'),
        onLeaveBack: () => setMode('stage'),
      })
      ScrollTrigger.create({
        trigger: '#world',
        start: 'top bottom',
        end: 'bottom top',
        onToggle: (s) => setMode(s.isActive ? 'world' : 'off'),
        onUpdate: (s) => (S.world = s.progress),
      })
    })
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
    return () => ctx.revert()
  }, [setMode])

  // ── readiness ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (webgl) return
    document.documentElement.classList.add('no-gl')
    document.fonts?.ready.then(() => setReady(true))
    S.reveal = 1
  }, [webgl])

  useEffect(() => {
    if (ready && !S.reduced) gsap.to(S, { reveal: 1, duration: 2.8, ease: 'expo.out', delay: 0.1 })
  }, [ready])

  // ── ENTER EXPERIENCE ──────────────────────────────────────────────────────
  const enter = useCallback(() => {
    if (S.entered) return
    S.entered = true
    setIntroOpen(false)
    const d = S.reduced ? 0.01 : 1
    gsap.to(S, { intro: 0, duration: 2.1 * d, ease: 'power3.inOut' })
    gsap.to(S, { spin: 1, duration: 2.4 * d, ease: 'power2.inOut' })
    gsap.delayedCall(0.9 * d, () => setEntered(true))
    gsap.delayedCall(1.6 * d, () => {
      document.documentElement.classList.remove('locked')
      S.lenis?.start()
      ScrollTrigger.refresh()
    })
  }, [])

  useEffect(() => {
    if (!ready || S.entered) return
    let y0 = 0
    const key = (e) => ['Enter', ' ', 'ArrowDown', 'PageDown'].includes(e.key) && (e.preventDefault(), enter())
    const wheel = (e) => e.deltaY > 8 && enter()
    const ts = (e) => (y0 = e.touches[0].clientY)
    const tm = (e) => y0 - e.touches[0].clientY > 36 && enter()
    addEventListener('keydown', key)
    addEventListener('wheel', wheel, { passive: true })
    addEventListener('touchstart', ts, { passive: true })
    addEventListener('touchmove', tm, { passive: true })
    return () => {
      removeEventListener('keydown', key)
      removeEventListener('wheel', wheel)
      removeEventListener('touchstart', ts)
      removeEventListener('touchmove', tm)
    }
  }, [ready, enter])

  return (
    <>
      {webgl ? (
        <Boundary onFail={() => setWebgl(false)}>
          <Suspense fallback={null}>
            <WorldCanvas mode={mode} mobile={mobile} onReady={() => setReady(true)} />
          </Suspense>
        </Boundary>
      ) : (
        <div className={`canvas-wrap mode-${mode}`}>
          <Fallback />
        </div>
      )}

      <AnimatePresence>{introOpen && <IntroBack key="back" />}</AnimatePresence>

      <main>
        <Hero entered={entered} />
        <Journey />
        <Art />
        <Collection />
        <Details />
        <Message />
        <Contact />
      </main>

      <AnimatePresence>{introOpen && <IntroFront key="front" ready={ready} onEnter={enter} />}</AnimatePresence>
      {S.finePointer && <Cursor />}
      <div className="grain" aria-hidden="true" />
    </>
  )
}
