import { useEffect, useRef } from 'react'
import { gsap } from '../lib/anim'
import { S } from '../state'
import { collection } from '../data/photos'
import Photo from './Photo'
import Words, { useWordsReveal } from './Words'

// asymmetric editorial layout — organic masks rather than rectangular cards
const LAYOUT = [
  { shape: 'arch', ratio: '4 / 5', cls: 'c1' },
  { shape: 'blob', ratio: '1 / 1', cls: 'c2' },
  { shape: 'pill', ratio: '2 / 3', cls: 'c3' },
  { shape: 'circle', ratio: '1 / 1', cls: 'c4' },
  { shape: 'soft', ratio: '5 / 4', cls: 'c5' },
  { shape: 'blob2', ratio: '4 / 5', cls: 'c6' },
  { shape: 'arch', ratio: '4 / 5', cls: 'c7' },
]

function Card({ item, i, layout }) {
  const root = useRef(null)
  useEffect(() => {
    const el = root.current
    const ctx = gsap.context(() => {
      const mask = el.querySelector('.reveal')
      const img = el.querySelector('.photo-in')
      if (!S.reduced) {
        gsap.fromTo(mask, { clipPath: 'inset(100% -40% -40% -40%)' }, { clipPath: 'inset(-40% -40% -40% -40%)', duration: 1.7, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } })
        gsap.fromTo(el.querySelector('.card-label'), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1, delay: 0.5, scrollTrigger: { trigger: el, start: 'top 88%', once: true } })
      }
      if (!S.finePointer || S.reduced) return
      const rx = gsap.quickTo(el.querySelector('.tilt'), 'rotationX', { duration: 0.6, ease: 'power3' })
      const ry = gsap.quickTo(el.querySelector('.tilt'), 'rotationY', { duration: 0.6, ease: 'power3' })
      const ix = gsap.quickTo(img, 'x', { duration: 0.8, ease: 'power3' })
      const iy = gsap.quickTo(img, 'y', { duration: 0.8, ease: 'power3' })
      const lx = gsap.quickTo(el.querySelector('.card-label'), 'x', { duration: 0.8, ease: 'power3' })
      const move = (e) => {
        const r = el.getBoundingClientRect()
        const nx = (e.clientX - r.left) / r.width - 0.5
        const ny = (e.clientY - r.top) / r.height - 0.5
        ry(nx * 14)
        rx(-ny * 14)
        ix(-nx * 26)
        iy(-ny * 26)
        lx(nx * 12)
      }
      const leave = () => {
        rx(0); ry(0); ix(0); iy(0); lx(0)
      }
      el.addEventListener('pointermove', move)
      el.addEventListener('pointerleave', leave)
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <figure className={`card ${layout.cls}`} ref={root} data-cursor>
      <div className="tilt">
        <div className={`card-shape shape-${layout.shape}`}>
          <div className="reveal">
            <Photo src={item.src} tone={item.tone} seed={item.id} cols={9 + (i % 4)} label={`No. 0${item.id}`} ratio={layout.ratio} alt={item.caption} className="fill" />
          </div>
        </div>
      </div>
      <figcaption className="card-label">
        <span>No. 0{item.id}</span>
        {item.caption && <em>{item.caption}</em>}
      </figcaption>
    </figure>
  )
}

export default function Collection() {
  const head = useRef(null)
  useWordsReveal(head, { start: 'top 82%' })
  return (
    <section id="collection" className="collection" aria-label="The collection">
      <div className="collection-head">
        <p className="eyebrow">The collection</p>
        <h2 className="display" ref={head}>
          <Words lines={['Little things.', 'Endless love.']} em={1} />
        </h2>
      </div>
      <div className="grid">
        {collection.map((item, i) => (
          <Card key={item.id} item={item} i={i} layout={LAYOUT[i]} />
        ))}
      </div>
    </section>
  )
}
