import * as THREE from 'three'

// ── tiny seeded RNG ─────────────────────────────────────────────────────────
export function rng(seed = 1) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

const tint = (hex, l) => new THREE.Color(hex).offsetHSL(0, 0, l).getStyle()

/**
 * Draw a seamless field of crochet "V" stitches.
 * Returns two canvases: albedo (neutral light yarn, tinted later by material colour)
 * and a bump map (stitch relief).
 */
export function makeStitchCanvases({
  size = 512,
  cols = 9,
  rows = 12,
  base = '#ECE6DC',
  seed = 7,
  fuzz = 900,
} = {}) {
  const rand = rng(seed)
  const mk = () => {
    const c = document.createElement('canvas')
    c.width = c.height = size
    return c
  }
  const color = mk()
  const bump = mk()
  const cx = color.getContext('2d')
  const bx = bump.getContext('2d')
  cx.fillStyle = tint(base, -0.38)
  cx.fillRect(0, 0, size, size)
  bx.fillStyle = '#000'
  bx.fillRect(0, 0, size, size)
  cx.lineCap = bx.lineCap = 'round'

  const cw = size / cols
  const rh = size / rows
  const legW = cw * 0.5
  const legH = rh * 1.55

  const leg = (x1, y1, x2, y2, jitter) => {
    // shadow / depth
    cx.strokeStyle = tint(base, -0.3)
    cx.lineWidth = legW * 1.12
    cx.beginPath()
    cx.moveTo(x1 + 1.5, y1 + 2)
    cx.lineTo(x2 + 1.5, y2 + 2)
    cx.stroke()
    // body
    cx.strokeStyle = tint(base, jitter - 0.04)
    cx.lineWidth = legW
    cx.beginPath()
    cx.moveTo(x1, y1)
    cx.lineTo(x2, y2)
    cx.stroke()
    // highlight
    cx.strokeStyle = tint(base, jitter + 0.07)
    cx.lineWidth = legW * 0.26
    cx.beginPath()
    cx.moveTo(x1 - legW * 0.12, y1)
    cx.lineTo(x2 - legW * 0.12, y2)
    cx.stroke()
    // plied-yarn twist hatching
    const dx = x2 - x1
    const dy = y2 - y1
    const len = Math.hypot(dx, dy)
    const nx = -dy / len
    const ny = dx / len
    cx.strokeStyle = tint(base, -0.26)
    cx.globalAlpha = 0.55
    cx.lineWidth = 1.3
    for (let k = 1; k < 7; k++) {
      const t = k / 7
      const px = x1 + dx * t
      const py = y1 + dy * t
      cx.beginPath()
      cx.moveTo(px - nx * legW * 0.42 - dx * 0.025, py - ny * legW * 0.42 - dy * 0.025)
      cx.lineTo(px + nx * legW * 0.42 + dx * 0.025, py + ny * legW * 0.42 + dy * 0.025)
      cx.stroke()
    }
    cx.globalAlpha = 1

    // bump
    bx.strokeStyle = '#555'
    bx.lineWidth = legW * 1.1
    bx.beginPath()
    bx.moveTo(x1, y1)
    bx.lineTo(x2, y2)
    bx.stroke()
    bx.strokeStyle = '#d8d8d8'
    bx.lineWidth = legW * 0.7
    bx.beginPath()
    bx.moveTo(x1 - legW * 0.06, y1)
    bx.lineTo(x2 - legW * 0.06, y2)
    bx.stroke()
    bx.strokeStyle = '#fff'
    bx.lineWidth = legW * 0.22
    bx.beginPath()
    bx.moveTo(x1 - legW * 0.14, y1)
    bx.lineTo(x2 - legW * 0.14, y2)
    bx.stroke()
  }

  for (let j = -1; j <= rows; j++) {
    for (let i = -1; i <= cols; i++) {
      const jitter = (rand() - 0.5) * 0.05
      const x = i * cw + cw / 2 + (j % 2 ? 0 : 0)
      const y = j * rh + rh / 2
      for (const ox of [-size, 0, size]) {
        for (const oy of [-size, 0, size]) {
          const X = x + ox
          const Y = y + oy
          if (X < -cw * 2 || X > size + cw * 2 || Y < -rh * 2 || Y > size + rh * 2) continue
          leg(X - cw * 0.26, Y - legH * 0.5, X, Y + legH * 0.5, jitter)
          leg(X + cw * 0.26, Y - legH * 0.5, X, Y + legH * 0.5, jitter)
        }
      }
    }
  }

  // loose fibres / halo
  cx.lineWidth = 1
  for (let k = 0; k < fuzz; k++) {
    const x = rand() * size
    const y = rand() * size
    const a = rand() * Math.PI * 2
    const l = 3 + rand() * 9
    cx.strokeStyle = rand() > 0.5 ? tint(base, 0.12) : tint(base, -0.18)
    cx.globalAlpha = 0.35
    cx.beginPath()
    cx.moveTo(x, y)
    cx.quadraticCurveTo(x + Math.cos(a) * l * 0.6, y + Math.sin(a) * l * 0.6 + 2, x + Math.cos(a) * l, y + Math.sin(a) * l)
    cx.stroke()
  }
  cx.globalAlpha = 1
  return { color, bump }
}

/** Plied (twisted) yarn tile — wraps seamlessly around a tube. */
export function makePlyCanvases({ size = 128, plies = 4, base = '#ECE6DC' } = {}) {
  const mk = () => {
    const c = document.createElement('canvas')
    c.width = c.height = size
    return c
  }
  const color = mk()
  const bump = mk()
  const cx = color.getContext('2d')
  const bx = bump.getContext('2d')
  const pitch = size / plies
  cx.fillStyle = tint(base, -0.3)
  cx.fillRect(0, 0, size, size)
  bx.fillStyle = '#000'
  bx.fillRect(0, 0, size, size)
  cx.lineCap = bx.lineCap = 'butt'
  const slope = pitch / size
  for (let k = -1; k <= plies; k++) {
    for (let t = 0; t < pitch; t += 0.5) {
      const u = t / pitch
      const shade = Math.sin(u * Math.PI) // 0 edge → 1 centre
      const x0 = k * pitch + t
      for (const ox of [-size, 0, size]) {
        cx.strokeStyle = tint(base, -0.34 + shade * 0.42)
        cx.lineWidth = 1.2
        cx.beginPath()
        cx.moveTo(x0 + ox, 0)
        cx.lineTo(x0 + ox + slope * size, size)
        cx.stroke()
        const g = Math.round(40 + shade * 215)
        bx.strokeStyle = `rgb(${g},${g},${g})`
        bx.lineWidth = 1.2
        bx.beginPath()
        bx.moveTo(x0 + ox, 0)
        bx.lineTo(x0 + ox + slope * size, size)
        bx.stroke()
      }
    }
  }
  return { color, bump }
}

// ── cached THREE textures ───────────────────────────────────────────────────
const canvasCache = {}
const texCache = {}

function tex(canvas, rx, ry, srgb, aniso) {
  const t = new THREE.CanvasTexture(canvas)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(rx, ry)
  t.anisotropy = aniso
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  t.needsUpdate = true
  return t
}

export function stitchTextures(rx = 1, ry = 1, { size = 512, aniso = 8 } = {}) {
  const key = `s${rx}x${ry}x${size}`
  if (texCache[key]) return texCache[key]
  canvasCache.stitch ??= makeStitchCanvases({ size })
  const c = canvasCache.stitch
  return (texCache[key] = { map: tex(c.color, rx, ry, true, aniso), bump: tex(c.bump, rx, ry, false, aniso) })
}

export function plyTextures(rx = 1, ry = 1, { aniso = 8 } = {}) {
  const key = `p${rx}x${ry}`
  if (texCache[key]) return texCache[key]
  canvasCache.ply ??= makePlyCanvases({})
  const c = canvasCache.ply
  return (texCache[key] = { map: tex(c.color, rx, ry, true, aniso), bump: tex(c.bump, rx, ry, false, aniso) })
}

// ── DOM placeholder image (for photo slots without a real photograph) ───────
const phCache = {}
export function placeholderDataURL(tone = '#B97861', seed = 3, cols = 10, w = 900, h = 1100) {
  const key = `${tone}|${seed}|${cols}|${w}`
  if (phCache[key]) return phCache[key]
  const rows = Math.round(cols * 1.25)
  const { color, bump } = makeStitchCanvases({ size: 512, cols, rows, base: '#ECE6DC', seed, fuzz: 500 })
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  const pat = ctx.createPattern(color, 'repeat')
  ctx.fillStyle = pat
  ctx.fillRect(0, 0, w, h)
  // tint with the tone, then add stitch relief from the bump map
  ctx.globalCompositeOperation = 'multiply'
  ctx.fillStyle = tone
  ctx.fillRect(0, 0, w, h)
  ctx.globalCompositeOperation = 'soft-light'
  ctx.fillStyle = ctx.createPattern(bump, 'repeat')
  ctx.fillRect(0, 0, w, h)
  ctx.globalAlpha = 0.6
  ctx.fillRect(0, 0, w, h)
  ctx.globalAlpha = 1
  // soft vignette
  ctx.globalCompositeOperation = 'source-over'
  const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.8)
  g.addColorStop(0, 'rgba(255,240,220,0.18)')
  g.addColorStop(1, 'rgba(40,25,18,0.45)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  return (phCache[key] = c.toDataURL('image/jpeg', 0.82))
}
