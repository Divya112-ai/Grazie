import { useEffect, useMemo, useRef } from 'react'
import { gsap } from '../lib/anim'
import { S } from '../state'
import Words, { useWordsReveal } from './Words'

/** A doily-like crochet motif: concentric rings of overlapping loops. */
function Doily() {
  const loops = useMemo(() => {
    const out = []
    ;[28, 56, 86, 118, 152, 188].forEach((r, ri) => {
      const n = Math.round((r * Math.PI * 2) / (16 + ri * 2.2))
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + (ri % 2 ? Math.PI / n : 0)
        out.push({ x: 200 + Math.cos(a) * r, y: 200 + Math.sin(a) * r, r: 9 + ri * 2.4 })
      }
    })
    return out
  }, [])
  return (
    <svg className="doily" viewBox="0 0 400 400" aria-hidden="true">
      <g>
        {loops.map((l, i) => (
          <circle key={i} cx={l.x} cy={l.y} r={l.r} />
        ))}
        <circle cx="200" cy="200" r="9" className="solid" />
      </g>
    </svg>
  )
}

/** Row of interlocking chain stitches. */
function Chain() {
  const n = 30
  return (
    <svg className="chain" viewBox="0 0 1200 90" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => {
        const x = 30 + i * 38
        const y = 45 + Math.sin(i * 0.5) * 9
        return (
          <g key={i} transform={`rotate(${Math.cos(i * 0.5) * 9} ${x} ${y})`}>
            <ellipse cx={x} cy={y} rx="30" ry="14" pathLength="1" />
            <ellipse cx={x} cy={y} rx="21" ry="8" pathLength="1" className="in" />
          </g>
        )
      })}
    </svg>
  )
}

export default function Message() {
  const root = useRef(null)
  const head = useRef(null)
  useWordsReveal(head, { start: 'top 80%' })
  useEffect(() => {
    const ctx = gsap.context(() => {
      const els = gsap.utils.toArray('.chain ellipse')
      els.forEach((e) => {
        e.style.strokeDasharray = 1
        e.style.strokeDashoffset = S.reduced ? 0 : 1
      })
      if (S.reduced) return
      gsap.to(els, {
        strokeDashoffset: 0,
        ease: 'none',
        stagger: { each: 0.03 },
        scrollTrigger: { trigger: '.chain', start: 'top 92%', end: 'top 45%', scrub: 0.6 },
      })
      gsap.fromTo('.doily', { rotate: -30, scale: 0.75, opacity: 0 }, { rotate: 40, scale: 1, opacity: 1, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top 85%', end: 'bottom top', scrub: 1 } })
      gsap.fromTo('.msg-sub', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1.4, ease: 'power3.out', scrollTrigger: { trigger: '.msg-sub', start: 'top 90%', once: true } })
    }, root)
    return () => ctx.revert()
  }, [])
  return (
    <section id="message" className="message" ref={root} aria-label="Brand message">
      <Doily />
      <div className="message-inner">
        <h2 className="display big" ref={head}>
          <Words lines={['Every stitch', 'tells a story.']} em={1} />
        </h2>
        <p className="msg-sub">
          Created slowly, thoughtfully and with love. Because the most beautiful things are the ones made by hand.
        </p>
      </div>
      <Chain />
    </section>
  )
}
