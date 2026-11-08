import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { stitchTextures, plyTextures, rng } from '../lib/crochet'

export const PAL = {
  ivory: '#F8F3EA',
  cream: '#EDE2D2',
  beige: '#D8C4AA',
  cocoa: '#6B4938',
  terra: '#B97861',
  choc: '#34251F',
}

// ── materials ───────────────────────────────────────────────────────────────
export function makeMats({ mobile, aniso }) {
  const Mat = mobile ? THREE.MeshStandardMaterial : THREE.MeshPhysicalMaterial
  const cache = new Map()
  const fuzz = (m) => {
    if (!mobile) {
      m.sheen = 1
      m.sheenRoughness = 0.55
      m.sheenColor = new THREE.Color('#fff0df')
    }
    return m
  }
  const size = mobile ? 384 : 512
  const stitch = (color, rx = 2, ry = 3, bump = 2.4, vertexColors = false) => {
    const key = `s|${color}|${rx}|${ry}|${vertexColors}`
    if (cache.has(key)) return cache.get(key)
    const t = stitchTextures(rx, ry, { size, aniso })
    const m = fuzz(
      new Mat({ color, map: t.map, bumpMap: t.bump, bumpScale: bump, roughness: 1, metalness: 0, vertexColors }),
    )
    cache.set(key, m)
    return m
  }
  const yarn = (color, repeatU, bump = 2.0) => {
    const key = `y|${color}|${repeatU.toFixed(1)}`
    if (cache.has(key)) return cache.get(key)
    const t = plyTextures(repeatU, 1, { aniso })
    const m = fuzz(new Mat({ color, map: t.map, bumpMap: t.bump, bumpScale: bump, roughness: 1, metalness: 0 }))
    cache.set(key, m)
    return m
  }
  return { stitch, yarn }
}

// ── a wound yarn ball: one long strand, great circles with a slowly precessing axis ──
class WoundCurve extends THREE.Curve {
  constructor(R, turns) {
    super()
    this.R = R
    this.turns = turns
    this._n = new THREE.Vector3()
    this._e1 = new THREE.Vector3()
    this._e2 = new THREE.Vector3()
    this._up = new THREE.Vector3(0, 1, 0)
  }
  getPoint(t, target = new THREE.Vector3()) {
    const turns = t * this.turns
    const ang = turns * Math.PI * 2
    const b = turns * 0.62
    const a = 0.9 + 0.55 * Math.sin(turns * 0.33)
    const n = this._n.set(Math.sin(a) * Math.cos(b), Math.cos(a), Math.sin(a) * Math.sin(b))
    const e1 = this._e1.copy(n).cross(this._up).normalize()
    const e2 = this._e2.copy(n).cross(e1)
    const r = this.R * (0.86 + 0.14 * t) + 0.018 * Math.sin(turns * 7.1)
    return target.set(0, 0, 0).addScaledVector(e1, Math.cos(ang) * r).addScaledVector(e2, Math.sin(ang) * r)
  }
}

export const BALL_DIR = new THREE.Vector3(0.52, -0.42, 0.74).normalize()
export const FLOWER_POS = new THREE.Vector3(0, 0, 0.9)

export function buildBall({ mats, mobile }) {
  const R = 1.25
  const turns = mobile ? 40 : 72
  const segs = turns * 70
  const radial = mobile ? 4 : 5
  const curve = new WoundCurve(R, turns)
  curve.arcLengthDivisions = segs
  const geo = new THREE.TubeGeometry(curve, segs, 0.062, radial, false)
  const end = curve.getPoint(1).normalize()
  geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(end, BALL_DIR))
  const len = curve.getLength()
  const tube = new THREE.Mesh(geo, mats.yarn(PAL.terra, len / 0.62, 1.3))
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(R * 0.84, mobile ? 24 : 40, mobile ? 18 : 28),
    mats.stitch('#7d4f3e', 3, 2, 1),
  )
  const group = new THREE.Group()
  group.add(core, tube)
  return { group, geo, segs, radial, R }
}

// ── the strand that unwinds, travels, then curls into the flower's magic ring ──
export function buildStrand({ mats, mobile }) {
  const D = BALL_DIR
  const F = FLOWER_POS
  const pts = [
    D.clone().multiplyScalar(1.2),
    new THREE.Vector3(1.5, -1.3, 1.5),
    new THREE.Vector3(2.7, -1.7, 1.0),
    new THREE.Vector3(3.9, -0.8, 0.1),
    new THREE.Vector3(4.2, 0.9, -0.7),
    new THREE.Vector3(3.0, 2.2, 0.0),
    new THREE.Vector3(1.0, 2.5, 1.0),
    new THREE.Vector3(-1.3, 1.9, 1.4),
    new THREE.Vector3(-3.2, 0.9, 0.8),
    new THREE.Vector3(-4.0, -0.7, 0.0),
    new THREE.Vector3(-3.0, -2.2, 0.8),
    new THREE.Vector3(-1.0, -2.5, 1.4),
  ]
  const K = 17
  for (let k = 0; k < K; k++) {
    const th = -Math.PI / 2 + k * 0.85
    const r = 2.2 * (1 - k / (K + 1)) + 0.12
    pts.push(new THREE.Vector3(F.x + r * Math.cos(th), F.y + r * Math.sin(th) * 0.95, F.z + 0.06 * Math.sin(k * 1.7)))
  }
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal')
  const segs = mobile ? 520 : 900
  const radial = 6
  const geo = new THREE.TubeGeometry(curve, segs, 0.056, radial, false)
  const mesh = new THREE.Mesh(geo, mats.yarn(PAL.terra, curve.getLength() / 0.62, 1.3))
  mesh.frustumCulled = false
  return { mesh, geo, segs, radial }
}

// ── hero flower: each petal on a pivot so it can open with scroll ───────────
const petalGeo = new THREE.SphereGeometry(1, 26, 18)

export function buildFlower({ mats, mobile }) {
  const group = new THREE.Group()
  const pivots = []
  const layer = (n, len, width, thick, color, closed, open, rx, ry, phase, z) => {
    const mat = mats.stitch(color, rx, ry, 2.6)
    for (let i = 0; i < n; i++) {
      const spin = new THREE.Group()
      spin.rotation.z = phase + (i / n) * Math.PI * 2
      spin.position.z = z
      const tilt = new THREE.Group()
      const m = new THREE.Mesh(petalGeo, mat)
      m.position.y = len * 0.92
      m.scale.set(width, len, thick)
      tilt.add(m)
      spin.add(tilt)
      group.add(spin)
      pivots.push({ tilt, closed: closed + (i % 2) * 0.06, open: open + (i % 2) * 0.05 })
    }
  }
  layer(8, 1.2, 0.58, 0.2, PAL.terra, 1.38, 0.1, 1.2, 1.8, 0, 0)
  layer(8, 0.96, 0.5, 0.2, PAL.beige, 1.2, 0.34, 1.0, 1.6, Math.PI / 8, 0.1)
  layer(6, 0.62, 0.4, 0.22, PAL.cream, 0.95, 0.62, 0.8, 1.3, 0.3, 0.2)
  const center = new THREE.Mesh(new THREE.SphereGeometry(0.34, 28, 20), mats.stitch(PAL.cocoa, 3, 2, 3))
  center.scale.set(1, 1, 0.78)
  center.position.z = 0.28
  group.add(center)
  return { group, pivots, center }
}

// ── loose floating strands around the hero ball ─────────────────────────────
export function buildLoose({ mats, mobile }) {
  const rand = rng(21)
  const group = new THREE.Group()
  const items = []
  const colors = [PAL.cocoa, PAL.beige, PAL.terra, PAL.cream]
  const n = mobile ? 3 : 5
  for (let i = 0; i < n; i++) {
    let cx, cy
    for (let tries = 0; tries < 14; tries++) {
      cx = (rand() - 0.5) * 7
      cy = (rand() - 0.5) * 4.2
      if (!(cx < -0.3 && cy < 0.5)) break // keep the lower-left clear for the hero headline
    }
    const cz = -1.5 + rand() * 3
    const pts = []
    const m = 7
    for (let k = 0; k < m; k++) {
      const a = (k / (m - 1)) * Math.PI * (1.2 + rand() * 0.8) + rand() * 6
      const r = 0.7 + rand() * 0.9
      pts.push(new THREE.Vector3(cx + Math.cos(a) * r + k * 0.2, cy + Math.sin(a * 1.3) * r * 0.6, cz + Math.sin(a) * 0.7))
    }
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal')
    const geo = new THREE.TubeGeometry(curve, 160, 0.03, 5, false)
    const mesh = new THREE.Mesh(geo, mats.yarn(colors[i % colors.length], curve.getLength() / 0.3, 1.2))
    mesh.userData = { phase: rand() * 6, sp: 0.25 + rand() * 0.3, y: 0, c: new THREE.Vector3(cx, cy, cz) }
    group.add(mesh)
    items.push(mesh)
  }
  return { group, items }
}

// ── field of floating crochet objects ───────────────────────────────────────
function heartGeo() {
  const s = new THREE.Shape()
  s.moveTo(0, -0.62)
  s.bezierCurveTo(-0.15, -0.4, -0.85, -0.15, -0.85, 0.25)
  s.bezierCurveTo(-0.85, 0.65, -0.3, 0.8, 0, 0.42)
  s.bezierCurveTo(0.3, 0.8, 0.85, 0.65, 0.85, 0.25)
  s.bezierCurveTo(0.85, -0.15, 0.15, -0.4, 0, -0.62)
  const g = new THREE.ExtrudeGeometry(s, {
    depth: 0.25,
    bevelEnabled: true,
    bevelThickness: 0.2,
    bevelSize: 0.17,
    bevelSegments: 8,
    curveSegments: 22,
  })
  g.center()
  g.scale(0.85, 0.85, 0.85)
  return g
}

function flowerGeo(cOuter, cInner, cCenter, open, petals, mobile) {
  const parts = []
  const add = (geo, matrix, color) => {
    geo.applyMatrix4(matrix)
    const col = new THREE.Color(color)
    const arr = new Float32Array(geo.attributes.position.count * 3)
    for (let i = 0; i < arr.length; i += 3) {
      arr[i] = col.r
      arr[i + 1] = col.g
      arr[i + 2] = col.b
    }
    geo.setAttribute('color', new THREE.BufferAttribute(arr, 3))
    parts.push(geo)
  }
  const seg = mobile ? [14, 10] : [20, 14]
  const ring = (n, len, w, th, tilt, color, phase, z) => {
    for (let i = 0; i < n; i++) {
      const g = new THREE.SphereGeometry(1, seg[0], seg[1])
      const m = new THREE.Matrix4()
      const rz = new THREE.Matrix4().makeRotationZ(phase + (i / n) * Math.PI * 2)
      const rx = new THREE.Matrix4().makeRotationX(tilt)
      const tr = new THREE.Matrix4().makeTranslation(0, len * 0.92, 0)
      const sc = new THREE.Matrix4().makeScale(w, len, th)
      const lift = new THREE.Matrix4().makeTranslation(0, 0, z)
      m.multiplyMatrices(lift, rz).multiply(rx).multiply(tr).multiply(sc)
      add(g, m, color)
    }
  }
  ring(petals, 0.9, 0.44, 0.17, open, cOuter, 0, 0)
  ring(petals, 0.66, 0.38, 0.18, open + 0.2, cInner, Math.PI / petals, 0.07)
  const c = new THREE.SphereGeometry(0.26, seg[0], seg[1])
  add(c, new THREE.Matrix4().makeTranslation(0, 0, 0.17).multiply(new THREE.Matrix4().makeScale(1, 1, 0.8)), cCenter)
  return mergeGeometries(parts, false)
}

export function buildField({ mats, mobile, seed = 11 }) {
  const rand = rng(seed)
  const group = new THREE.Group()
  const items = []
  const count = mobile ? 20 : 36
  const radiusK = mobile ? 0.55 : 1

  const flowerMat = mats.stitch('#ffffff', 1.4, 1.4, 2.2, true)
  const flowers = [
    flowerGeo(PAL.terra, PAL.cream, PAL.cocoa, 0.32, 8, mobile),
    flowerGeo(PAL.beige, PAL.terra, PAL.cocoa, 0.45, 7, mobile),
    flowerGeo(PAL.cream, PAL.beige, PAL.terra, 0.3, 8, mobile),
    flowerGeo(PAL.cocoa, PAL.beige, PAL.cream, 0.4, 6, mobile),
  ]
  const ballGeo = new THREE.SphereGeometry(0.62, mobile ? 24 : 36, mobile ? 18 : 26)
  const ringGeo = new THREE.TorusGeometry(0.55, 0.24, mobile ? 14 : 20, mobile ? 28 : 44)
  const hGeo = heartGeo()
  const tints = [PAL.terra, PAL.beige, PAL.cocoa, PAL.cream, PAL.terra, PAL.beige]

  for (let i = 0; i < count; i++) {
    const r = rand()
    const kind = r < 0.4 ? 'flower' : r < 0.62 ? 'ball' : r < 0.78 ? 'ring' : 'heart'
    const tint = tints[Math.floor(rand() * tints.length)]
    let mesh
    if (kind === 'flower') mesh = new THREE.Mesh(flowers[Math.floor(rand() * flowers.length)], flowerMat)
    else if (kind === 'ball') mesh = new THREE.Mesh(ballGeo, mats.stitch(tint, 3, 2, 2.4))
    else if (kind === 'ring') mesh = new THREE.Mesh(ringGeo, mats.stitch(tint, 7, 2, 2.4))
    else mesh = new THREE.Mesh(hGeo, mats.stitch(tint, 2.2, 2.2, 2.4))
    const near = i % 3 === 0
    const z = near ? 1 - rand() * 15 : -22 - rand() * 38
    const ang = rand() * Math.PI * 2
    const rad = (2.6 + rand() * 4.2) * radiusK
    const base = new THREE.Vector3(Math.cos(ang) * rad * 1.15, Math.sin(ang) * rad * 0.7, z)
    const s = 0.8 + rand() * 0.9
    mesh.position.copy(base)
    mesh.rotation.set((rand() - 0.5) * 0.9, (rand() - 0.5) * 0.9, rand() * 6)
    mesh.userData = {
      base,
      s,
      phase: rand() * 6.28,
      speed: 0.4 + rand() * 0.5,
      spin: (rand() - 0.5) * 0.5,
      rx: mesh.rotation.x,
      ry: mesh.rotation.y,
      kind,
    }
    mesh.scale.setScalar(0.001)
    group.add(mesh)
    items.push(mesh)
  }
  return { group, items }
}
