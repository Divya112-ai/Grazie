import { useEffect, useRef } from 'react'
import { gsap } from '../lib/anim'
import { S } from '../state'
import Words, { useWordsReveal } from './Words'

export default function Hero({ entered }) {
  const root = useRef(null)
  const title = useRef(null)
  useWordsReveal(title, { when: entered, start: 'top 100%', delay: 0.1 })

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (entered) {
        gsap.fromTo(
          '.hero-sub, .scroll-hint',
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: S.reduced ? 0 : 1.4, ease: 'power3.out', delay: S.reduced ? 0 : 0.9, stagger: 0.2 },
        )
      }
      if (!S.reduced) {
        gsap.to('.hero-inner', {
          yPercent: -26,
          opacity: 0,
          ease: 'none',
          scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom 35%', scrub: true },
        })
      }
    }, root)
    return () => ctx.revert()
  }, [entered])

  return (
    <section id="hero" className="hero" ref={root} aria-label="Introduction">
      <div className="hero-inner">
        <h1 className="hero-title" ref={title}>
          <Words lines={['Made by hand.', 'Made with love.']} em={1} />
        </h1>
        <p className="hero-sub">A little world of handmade wonders, woven with patience, creativity and love.</p>
      </div>
      <div className="scroll-hint" aria-hidden="true">
        <span>Scroll</span>
        <i />
      </div>
    </section>
  )
}
