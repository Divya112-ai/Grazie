import { useEffect, useRef } from 'react'
import { S, smooth } from '../state'
import { placeholderDataURL } from '../lib/crochet'

/** Static CSS visual used when WebGL is unavailable: a stitched ball that blooms into a flower with scroll. */
export default function Fallback() {
  const ball = useRef(null)
  const flower = useRef(null)
  useEffect(() => {
    const ph = placeholderDataURL('#B97861', 5, 8, 600, 600)
    ball.current.style.backgroundImage = `url(${ph})`
    flower.current.querySelectorAll('i').forEach((p, i) => {
      p.style.backgroundImage = `url(${placeholderDataURL(i % 2 ? '#D8C4AA' : '#B97861', 3 + i, 6, 400, 400)})`
    })
    let raf
    const tick = () => {
      const J = S.journey
      const hero = smooth(0, 0.9, S.hero)
      const b = ball.current
      const f = flower.current
      const shrink = 1 - smooth(0.05, 0.55, J)
      const portrait = innerWidth < innerHeight
      const x = (1 - hero) * (portrait ? 0 : 22) // vw
      const y = (1 - hero) * (portrait ? -16 : 0)
      b.style.transform = `translate(${x}vw, ${y}vh) scale(${(0.35 + 0.65 * shrink) * (1 - smooth(0.5, 0.6, J))}) rotate(${J * 540}deg)`
      b.style.opacity = shrink < 0.01 ? 0 : 1
      const fs = smooth(0.5, 0.68, J)
      const open = smooth(0.62, 0.82, J)
      f.style.transform = `scale(${fs * (1 - smooth(0.85, 1, J) * 0.4)}) rotate(${(1 - fs) * -120}deg)`
      f.style.opacity = (fs > 0.01 ? 1 : 0) * (1 - smooth(0.9, 1, J))
      f.querySelectorAll('i').forEach((p) => (p.style.transform = `${p.dataset.t} scaleY(${0.45 + 0.55 * open})`))
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [])
  return (
    <div className="fallback" aria-hidden="true">
      <div className="fb-ball" ref={ball} />
      <div className="fb-flower" ref={flower}>
        {Array.from({ length: 8 }, (_, i) => (
          <i key={i} data-t={`rotate(${i * 45}deg) translateY(-34%)`} />
        ))}
      </div>
    </div>
  )
}
