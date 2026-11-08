import { useEffect, useRef } from 'react'
import { gsap } from '../lib/anim'
import { S } from '../state'
import Words, { useWordsReveal } from './Words'

const IG = 'https://www.instagram.com/grazie_official_/'

const InstagramIcon = ({ size = 22 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
  </svg>
)

export default function Contact() {
  const root = useRef(null)
  const head = useRef(null)
  useWordsReveal(head, { start: 'top 80%' })

  useEffect(() => {
    const ctx = gsap.context(() => {
      const p = root.current.querySelector('.thread path')
      const len = p.getTotalLength()
      p.style.strokeDasharray = len
      p.style.strokeDashoffset = S.reduced ? 0 : len
      if (S.reduced) return
      gsap.to(p, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '.cta-wrap', start: 'top 85%', end: 'bottom 92%', scrub: 0.8 } })
      gsap.fromTo('.cta', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1.4, ease: 'power3.out', scrollTrigger: { trigger: '.cta-wrap', start: 'center 80%', once: true } })
      // magnetic pull
      if (S.finePointer) {
        const el = root.current.querySelector('.cta')
        const qx = gsap.quickTo(el, 'x', { duration: 0.7, ease: 'power3' })
        const qy = gsap.quickTo(el, 'y', { duration: 0.7, ease: 'power3' })
        const move = (e) => {
          const r = el.getBoundingClientRect()
          qx((e.clientX - (r.left + r.width / 2)) * 0.28)
          qy((e.clientY - (r.top + r.height / 2)) * 0.4)
        }
        const leave = () => (qx(0), qy(0))
        el.addEventListener('pointermove', move)
        el.addEventListener('pointerleave', leave)
      }
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section id="contact" className="contact" ref={root} aria-label="Contact">
      <div className="contact-inner">
        <h2 className="display big light" ref={head}>
          <Words lines={['Found something', 'you love?']} em={1} />
        </h2>
        <p className="contact-sub">Let’s make something special together.</p>
      </div>

      <div className="cta-wrap">
        <svg className="thread" viewBox="0 0 1000 700" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
          <path d="M860 -10 C 760 80, 980 170, 820 250 S 560 190, 640 290 S 420 360, 330 330 S 250 440, 380 470 S 600 450, 560 520 S 430 600, 500 700" />
        </svg>
        <a className="cta" href={IG} target="_blank" rel="noopener noreferrer" data-cursor>
          <span>Let’s connect on Instagram</span>
          <InstagramIcon size={20} />
        </a>
      </div>

      <footer className="footer">
        <p>GRAZIE — Handmade with love.</p>
        <a href={IG} target="_blank" rel="noopener noreferrer" aria-label="GRAZIE on Instagram" className="ig-link" data-cursor>
          <InstagramIcon size={22} />
        </a>
      </footer>
    </section>
  )
}
