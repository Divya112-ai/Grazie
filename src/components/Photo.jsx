import { useEffect, useRef, useState } from 'react'
import { placeholderDataURL } from '../lib/crochet'

/**
 * A photo slot. Shows the real photograph from /public/photos if it exists,
 * otherwise a clearly-labelled generated crochet-texture placeholder.
 */
export default function Photo({ src, tone, seed = 1, cols = 10, label, alt = '', ratio = '4 / 5', className = '' }) {
  const box = useRef(null)
  const [real, setReal] = useState(false)
  const [ph, setPh] = useState(null)

  useEffect(() => {
    let dead = false
    const im = new Image()
    im.onload = () => !dead && setReal(true)
    im.src = src
    return () => {
      dead = true
    }
  }, [src])

  // generate the placeholder lazily, just before it scrolls into view
  useEffect(() => {
    if (real || !box.current) return
    const el = box.current
    const make = () => {
      const run = () => setPh(placeholderDataURL(tone, seed, cols, 640, 800))
      if (window.requestIdleCallback) window.requestIdleCallback(run, { timeout: 400 })
      else setTimeout(run, 30)
    }
    if (!('IntersectionObserver' in window)) return make()
    const io = new IntersectionObserver(
      (e) => {
        if (e[0].isIntersecting) {
          io.disconnect()
          make()
        }
      },
      { rootMargin: '900px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [real, tone, seed, cols])

  return (
    <div ref={box} className={`photo ${className}`} style={{ aspectRatio: ratio, background: tone }}>
      <div className="photo-in">
        {(real || ph) && (
          <img
            className="photo-img"
            src={real ? src : ph}
            alt={real ? alt : ''}
            loading="lazy"
            decoding="async"
            draggable="false"
          />
        )}
      </div>
      {!real && <span className="ph-tag">Photo slot · {label}</span>}
    </div>
  )
}
