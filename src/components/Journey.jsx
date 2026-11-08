import { useEffect, useRef } from 'react'
import { ScrollTrigger } from '../lib/anim'
import { smooth } from '../state'

const CAPS = [
  { r: [0.02, 0.27], k: '01 — Unwind', t: 'It begins with a single strand.' },
  { r: [0.3, 0.52], k: '02 — Travel', t: 'Pulled loop by loop, from hand to hand.' },
  { r: [0.58, 0.78], k: '03 — Bloom', t: 'And slowly, a flower opens.' },
  { r: [0.84, 1.01], k: '04 — Gather', t: 'Then a whole little world.' },
]

/** Pinned (sticky) stage that holds the captions of the scroll-driven 3D journey. */
export default function Journey() {
  const root = useRef(null)
  useEffect(() => {
    const caps = [...root.current.querySelectorAll('.cap')]
    const fill = root.current.querySelector('.meter-fill')
    const num = root.current.querySelector('.meter-num')
    const st = ScrollTrigger.create({
      trigger: root.current,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        const J = self.progress
        caps.forEach((el, i) => {
          const [a, b] = CAPS[i].r
          const inn = smooth(a, a + 0.05, J)
          const out = smooth(b - 0.05, b, J)
          const o = inn * (1 - out)
          el.style.opacity = o
          el.style.transform = `translate3d(0, ${(1 - inn) * 36 - out * 36}px, 0)`
          el.style.visibility = o < 0.01 ? 'hidden' : 'visible'
        })
        fill.style.transform = `scaleY(${J})`
        const idx = CAPS.findIndex((c) => J < c.r[1])
        num.textContent = `0${Math.min(4, (idx < 0 ? 4 : idx + 1))} / 04`
      },
    })
    return () => st.kill()
  }, [])

  return (
    <section id="journey" className="journey" ref={root} aria-label="The journey of a strand of yarn">
      <div className="journey-stick">
        {CAPS.map((c) => (
          <div className="cap" key={c.k}>
            <span className="cap-k">{c.k}</span>
            <p className="cap-t">{c.t}</p>
          </div>
        ))}
        <div className="meter" aria-hidden="true">
          <span className="meter-num">01 / 04</span>
          <span className="meter-line">
            <i className="meter-fill" />
          </span>
        </div>
      </div>
    </section>
  )
}
