import { Fragment, useEffect } from 'react'
import { gsap } from '../lib/anim'
import { S } from '../state'

/** Headline split into masked words. `lines` is an array; `em` is the index of an italic/terracotta line. */
export default function Words({ lines, em = -1, as: Tag = 'span', className = '' }) {
  return (
    <Tag className={`words ${className}`} aria-label={lines.join(' ')}>
      {lines.map((line, li) => (
        <span className={`line${em === li ? ' em' : ''}`} key={li} aria-hidden="true">
          {line.split(' ').map((w, i) => (
            <Fragment key={i}>
              <span className="w">
                <span className="wi">{w}</span>
              </span>{' '}
            </Fragment>
          ))}
        </span>
      ))}
    </Tag>
  )
}

/** Animate the words of `ref` into view (scroll-triggered once). */
export function useWordsReveal(ref, { when = true, start = 'top 88%', delay = 0 } = {}) {
  useEffect(() => {
    const el = ref.current
    if (!when || !el) return
    const inner = el.querySelectorAll('.wi')
    if (S.reduced) {
      gsap.set(inner, { clearProps: 'all' })
      return
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(
        inner,
        { yPercent: 118, rotate: 4, opacity: 1, letterSpacing: '0.05em' },
        {
          yPercent: 0,
          rotate: 0,
          letterSpacing: '-0.012em',
          duration: 1.5,
          ease: 'expo.out',
          stagger: 0.07,
          delay,
          scrollTrigger: { trigger: el, start, once: true },
        },
      )
    }, el)
    return () => ctx.revert()
  }, [when]) // eslint-disable-line react-hooks/exhaustive-deps
}
