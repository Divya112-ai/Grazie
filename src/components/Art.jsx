import { useEffect, useRef } from 'react'
import { gsap } from '../lib/anim'
import { S } from '../state'
import { details } from '../data/photos'
import Photo from './Photo'
import Words, { useWordsReveal } from './Words'

const STATEMENT =
  'Every loop is pulled by hand, one at a time — so every piece carries a little of the person who made it.'

export default function Art() {
  const root = useRef(null)
  const head = useRef(null)
  useWordsReveal(head, { start: 'top 80%' })

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // ── parallax floaters beside the sticky headline
        gsap.utils.toArray('.art-float').forEach((el) => {
          gsap.fromTo(
            el,
            { yPercent: Number(el.dataset.from) },
            {
              yPercent: Number(el.dataset.to),
              ease: 'none',
              scrollTrigger: { trigger: '.art-a', start: 'top bottom', end: 'bottom top', scrub: true },
            },
          )
        })
        // ── image reveals (vertical mask)
        gsap.utils.toArray('.art-float .reveal').forEach((el) => {
          gsap.fromTo(
            el,
            { clipPath: 'inset(100% -40% -40% -40%)' },
            { clipPath: 'inset(-40% -40% -40% -40%)', duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } },
          )
        })

        // ── sticky horizontal gallery
        const track = root.current.querySelector('.h-track')
        const dist = () => Math.max(0, track.scrollWidth - window.innerWidth)
        const tween = gsap.to(track, {
          x: () => -dist(),
          ease: 'none',
          scrollTrigger: {
            trigger: '.art-h',
            start: 'top top',
            end: () => '+=' + dist(),
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        })
        gsap.to('.h-progress i', {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: { trigger: '.art-h', start: 'top top', end: () => '+=' + dist(), scrub: true, invalidateOnRefresh: true },
        })
        gsap.utils.toArray('.h-item').forEach((el) => {
          const rv = el.querySelector('.reveal')
          const im = el.querySelector('.photo-in')
          if (rv)
            gsap.fromTo(
              rv,
              { clipPath: 'inset(-40% 100% -40% -40%)' },
              {
                clipPath: 'inset(-40% -40% -40% -40%)',
                ease: 'none',
                scrollTrigger: { trigger: el, containerAnimation: tween, start: 'left 92%', end: 'left 50%', scrub: true },
              },
            )
          if (im)
            gsap.fromTo(
              im,
              { xPercent: -6, scale: 1.15 },
              { xPercent: 6, scale: 1.15, ease: 'none', scrollTrigger: { trigger: el, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } },
            )
        })
        gsap.utils.toArray('.h-text .wi').forEach((el) => {
          gsap.fromTo(
            el,
            { yPercent: 105, opacity: 1 },
            { yPercent: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el.closest('.h-item'), containerAnimation: tween, start: 'left 90%', once: true } },
          )
        })

        // ── statement lights up word by word
        gsap.fromTo(
          '.sw',
          { opacity: 0.14 },
          { opacity: 1, ease: 'none', stagger: 0.12, scrollTrigger: { trigger: '.art-c', start: 'top 72%', end: 'bottom 62%', scrub: true } },
        )
      })
      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set('.sw', { opacity: 1 })
      })
    }, root)
    return () => ctx.revert()
  }, [])

  const [d1, d2, d3, d4] = details
  const img = (d, i, ratio, shape, label) => (
    <Photo src={d.src} tone={d.tone} seed={20 + i} cols={14} label={label} ratio={ratio} className={`shape-${shape}`} />
  )

  return (
    <section id="art" className="art" ref={root} aria-label="The art of handmade">
      {/* A — sticky headline with drifting close-ups */}
      <div className="art-a">
        <div className="art-a-stick">
          <p className="eyebrow">The art of handmade</p>
          <h2 className="display" ref={head}>
            <Words lines={['Not made by machines.', 'Made with meaning.']} em={1} />
          </h2>
        </div>
        <div className="art-float f1" data-from="30" data-to="-70">
          <div className="reveal">{img(d1, 1, '3 / 4', 'arch', 'Detail 01')}</div>
        </div>
        <div className="art-float f2" data-from="60" data-to="-110">
          <div className="reveal">{img(d2, 2, '1 / 1', 'circle', 'Detail 02')}</div>
        </div>
      </div>

      {/* B — pinned horizontal story */}
      <div className="art-h">
        <p className="eyebrow h-eyebrow">Close up</p>
        <div className="h-track">
          <div className="h-item h-text">
            <span className="mask"><span className="wi">Loop</span></span>
            <span className="mask em"><span className="wi">by loop.</span></span>
          </div>
          <div className="h-item h-photo p1">
            <div className="reveal">{img(d1, 3, '4 / 5', 'arch', 'Detail 01')}</div>
            <p className="h-note">Stitches, up close — every fibre a little different.</p>
          </div>
          <div className="h-item h-photo p2">
            <div className="reveal">{img(d2, 4, '5 / 4', 'blob', 'Detail 02')}</div>
          </div>
          <div className="h-item h-text">
            <span className="mask"><span className="wi">Row</span></span>
            <span className="mask em"><span className="wi">by row.</span></span>
          </div>
          <div className="h-item h-photo p3">
            <div className="reveal">{img(d3, 5, '1 / 1', 'circle', 'Detail 03')}</div>
            <p className="h-note">No two pieces are exactly alike.</p>
          </div>
          <div className="h-item h-photo p4">
            <div className="reveal">{img(d4, 6, '3 / 4', 'arch', 'Detail 04')}</div>
          </div>
          <div className="h-item h-text">
            <span className="mask"><span className="wi">Made</span></span>
            <span className="mask em"><span className="wi">slowly.</span></span>
          </div>
        </div>
        <div className="h-progress" aria-hidden="true"><i /></div>
      </div>

      {/* C — statement */}
      <div className="art-c">
        <p className="statement">
          {STATEMENT.split(' ').map((w, i) => (
            <span className="sw" key={i}>{w} </span>
          ))}
        </p>
      </div>
    </section>
  )
}
