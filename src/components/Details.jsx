import { useEffect, useRef } from 'react'
import { gsap } from '../lib/anim'
import { S } from '../state'
import { collection, details } from '../data/photos'
import Photo from './Photo'

const FLOATERS = [
  { src: details[0], cls: 'w1', depth: 0.9, shape: 'arch', ratio: '3 / 4', label: 'Detail 01' },
  { src: collection[2], cls: 'w2', depth: 0.45, shape: 'circle', ratio: '1 / 1', label: 'No. 03' },
  { src: details[2], cls: 'w3', depth: 1.2, shape: 'pill', ratio: '2 / 3', label: 'Detail 03' },
  { src: collection[4], cls: 'w4', depth: 0.65, shape: 'blob', ratio: '1 / 1', label: 'No. 05' },
  { src: details[3], cls: 'w5', depth: 0.3, shape: 'arch', ratio: '3 / 4', label: 'Detail 04' },
]

// organic yarn lines drawn across the installation
const LINES = [
  'M-20 120 C 180 20, 300 260, 520 150 S 860 40, 1040 180',
  'M-20 420 C 160 330, 320 560, 560 440 S 900 330, 1040 470',
  'M120 -20 C 60 200, 260 280, 200 520 S 330 620, 300 640',
  'M880 -20 C 960 160, 760 260, 840 420 S 960 560, 900 640',
]

export default function Details() {
  const root = useRef(null)
  useEffect(() => {
    const ctx = gsap.context(() => {
      const paths = gsap.utils.toArray('.yl path')
      paths.forEach((p) => {
        const len = p.getTotalLength()
        p.style.strokeDasharray = len
        p.style.strokeDashoffset = S.reduced ? 0 : len
      })
      if (!S.reduced) {
        gsap.to(paths, {
          strokeDashoffset: 0,
          ease: 'none',
          stagger: 0.12,
          scrollTrigger: { trigger: root.current, start: 'top 60%', end: 'bottom 40%', scrub: 1 },
        })
        gsap.utils.toArray('.wfloat').forEach((el) => {
          gsap.fromTo(
            el,
            { yPercent: 40 * Number(el.dataset.depth), opacity: 0, scale: 0.9 },
            { yPercent: -40 * Number(el.dataset.depth), opacity: 1, scale: 1, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top 80%', end: 'bottom 20%', scrub: true } },
          )
        })
      }
      // mouse parallax per layer
      if (S.finePointer && !S.reduced) {
        const setters = gsap.utils.toArray('.wfloat .wf-in').map((el) => ({
          x: gsap.quickTo(el, 'x', { duration: 1.2, ease: 'power3' }),
          y: gsap.quickTo(el, 'y', { duration: 1.2, ease: 'power3' }),
          d: Number(el.parentElement.dataset.depth),
        }))
        const lines = gsap.quickTo('.yl', 'x', { duration: 1.6, ease: 'power3' })
        const onMove = () => {
          setters.forEach((s) => {
            s.x(-S.mouse.x * 46 * s.d)
            s.y(S.mouse.y * 34 * s.d)
          })
          lines(-S.mouse.x * 14)
        }
        addEventListener('pointermove', onMove, { passive: true })
        return () => removeEventListener('pointermove', onMove)
      }
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section id="world" className="world" ref={root} aria-label="A world of details">
      <div className="world-stick">
        <svg className="yl" viewBox="0 0 1000 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          {LINES.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </svg>
        {FLOATERS.map((f, i) => (
          <div className={`wfloat ${f.cls}`} data-depth={f.depth} key={i}>
            <div className="wf-in">
              <Photo src={f.src.src} tone={f.src.tone} seed={40 + i} cols={10 + i} label={f.label} ratio={f.ratio} className={`shape-${f.shape}`} />
            </div>
          </div>
        ))}
        <div className="world-label">
          <p className="eyebrow light">A world of details</p>
          <p className="world-hint">Move through it.</p>
        </div>
      </div>
    </section>
  )
}
