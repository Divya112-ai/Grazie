import { motion } from 'framer-motion'

const ease = [0.2, 0.7, 0.1, 1]

/** Wordmark — sits BEHIND the 3D canvas so the yarn ball floats in front of it. */
export function IntroBack() {
  return (
    <motion.div
      className="intro-back"
      role="img"
      aria-label="GRAZIE"
      exit={{ opacity: 0, scale: 1.18, filter: 'blur(16px)', transition: { duration: 1.5, ease: [0.7, 0, 0.2, 1] } }}
    >
      <motion.div
        className="wordmark"
        initial={{ opacity: 0, letterSpacing: '0.45em' }}
        animate={{ opacity: 1, letterSpacing: '0.02em' }}
        transition={{ duration: 2.6, ease, delay: 0.15 }}
      >
        GRAZIE
      </motion.div>
    </motion.div>
  )
}

/** Loader → ENTER EXPERIENCE */
export function IntroFront({ ready, onEnter }) {
  return (
    <motion.div className="intro-front" exit={{ opacity: 0, transition: { duration: 0.7 } }}>
      <div className="intro-tag">
        <span>Handmade crochet</span>
      </div>
      <div className="intro-action">
        {!ready ? (
          <motion.div key="load" className="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <svg viewBox="0 0 60 60" width="46" height="46" aria-hidden="true">
              <circle className="loader-ring" cx="30" cy="30" r="22" />
            </svg>
            <span>Winding the yarn</span>
          </motion.div>
        ) : (
          <motion.button
            key="enter"
            className="enter-btn"
            onClick={onEnter}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease }}
          >
            <span className="enter-label">Enter experience</span>
            <span className="enter-arrow" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 4v15M6 13l6 6 6-6" />
              </svg>
            </span>
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}
