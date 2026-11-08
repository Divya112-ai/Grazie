import { useEffect, useRef } from 'react'

/** A small crochet loop that trails the pointer (fine pointers only). */
export default function Cursor() {
  const ring = useRef(null)
  useEffect(() => {
    const el = ring.current
    let x = innerWidth / 2,
      y = innerHeight / 2,
      tx = x,
      ty = y,
      raf
    const move = (e) => {
      tx = e.clientX
      ty = e.clientY
      el.classList.add('on')
      const hot = e.target.closest?.('a, button, [data-cursor]')
      el.classList.toggle('hot', !!hot)
      el.classList.toggle('inv', !!e.target.closest?.('.cta'))
    }
    const leave = () => el.classList.remove('on')
    const tick = () => {
      x += (tx - x) * 0.2
      y += (ty - y) * 0.2
      el.style.transform = `translate3d(${x}px,${y}px,0)`
      raf = requestAnimationFrame(tick)
    }
    addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerleave', leave)
    tick()
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('pointermove', move)
      document.removeEventListener('pointerleave', leave)
    }
  }, [])
  return (
    <div className="cursor" ref={ring} aria-hidden="true">
      <svg viewBox="0 0 44 44" width="44" height="44">
        <path className="loop" d="M22 7c8.5 0 15 6 15 14s-6.5 14-15 14S7 29 7 21 13.5 7 22 7Z" />
        <path className="loop tail" d="M31 31c3 3.5 6 5 9 4.5" />
        <circle className="dot" cx="22" cy="21" r="2" />
      </svg>
    </div>
  )
}
