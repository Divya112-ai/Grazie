import { useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { S, smooth, lerp } from '../state'
import {
  makeMats,
  buildBall,
  buildStrand,
  buildFlower,
  buildLoose,
  buildField,
  BALL_DIR,
  FLOWER_POS,
} from './build'

const FOV = 38
const TAU = Math.PI * 2
const FLY_END = -18
const damp = THREE.MathUtils.damp
const easeOut = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 4)
const IVORY = new THREE.Color('#F8F3EA')
const CHOC = new THREE.Color('#34251F')

/*
  One persistent scene, driven by scroll progress written into the shared `S` object
  by GSAP ScrollTrigger:
    S.hero    0..1  hero scrolling away          → ball glides to centre
    S.journey 0..1  pinned yarn journey          → unwind · travel · flower · bloom · fly-through
    S.world   0..1  "A world of details"         → camera drifts through the floating field
*/
function Scene({ mobile, onReady }) {
  const gl = useThree((s) => s.gl)
  const size = useThree((s) => s.size)
  const ballPos = useRef()
  const ballTilt = useRef()
  const ballSpin = useRef()
  const strandG = useRef()
  const flowerG = useRef()
  const fog = useRef()
  const pointL = useRef()
  const D = useRef({ j: 0, hero: 0, world: 0, mx: 0, my: 0, spin: 0, dark: 0, frames: 0, acc: 0, n: 0 }).current
  const look = useRef(new THREE.Vector3()).current
  const qSpin = useRef(new THREE.Quaternion()).current

  const built = useMemo(() => {
    const aniso = Math.min(8, gl.capabilities.getMaxAnisotropy())
    const mats = makeMats({ mobile, aniso })
    const o = {
      ball: buildBall({ mats, mobile }),
      strand: buildStrand({ mats, mobile }),
      flower: buildFlower({ mats, mobile }),
      loose: buildLoose({ mats, mobile }),
      field: buildField({ mats, mobile }),
    }
    o.strand.mesh.position.copy(FLOWER_POS).negate() // strand lives in a pivot group at the flower
    o.ball.group.traverse((c) => (c.frustumCulled = false))
    return o
  }, [gl, mobile])

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05)
    const cam = state.camera
    const reduced = S.reduced
    const t = reduced ? 0 : state.clock.elapsedTime
    const aspect = size.width / size.height
    const dark = S.mode === 'world' ? 1 : 0

    D.frames++
    if (D.frames === 3) onReady?.()
    // adaptive resolution guard
    D.acc += dtRaw
    if (++D.n === 90) {
      if (D.acc / 90 > 1 / 34 && state.viewport.dpr > 1) state.setDpr(1)
      D.acc = 0
      D.n = 0
    }

    // damped inputs (silky regardless of wheel steps)
    D.j = damp(D.j, S.journey, 6, dt)
    D.hero = damp(D.hero, S.hero, 6, dt)
    D.world = damp(D.world, S.world, 5, dt)
    D.mx = damp(D.mx, reduced ? 0 : S.mouse.x, 3.2, dt)
    D.my = damp(D.my, reduced ? 0 : S.mouse.y, 3.2, dt)
    D.spin = damp(D.spin, S.spin, 2.4, dt)
    if (D.dark !== dark) D.dark = dark // snap while the canvas is covered
    const J = D.j
    const mx = D.mx
    const my = D.my

    // viewport fitting (portrait screens pull the camera back)
    const fit = aspect < 1.25 ? Math.pow(1.25 / aspect, 0.95) : 1
    const baseZ = 8.6 * fit
    const halfH = baseZ * Math.tan(THREE.MathUtils.degToRad(FOV / 2))
    const halfW = halfH * aspect
    const portrait = aspect < 0.95

    // ── camera ────────────────────────────────────────────────────────────
    const fly = smooth(0.8, 1.0, J)
    const zPre = baseZ * (1 - 0.05 * smooth(0, 1, D.hero) - 0.04 * smooth(0, 0.45, J) - 0.1 * smooth(0.5, 0.7, J))
    let z = lerp(zPre, FLY_END, fly) - 28 * D.world
    cam.position.set(
      mx * 0.55 + Math.sin(J * TAU) * 0.55 * (1 - fly),
      my * 0.32 - 0.25 * smooth(0, 0.5, J) * (1 - fly),
      z,
    )
    look.set(
      mx * 1.2 * smooth(0.8, 1, J),
      my * 0.6 * smooth(0.8, 1, J),
      lerp(0.5, z - 12, smooth(0.72, 0.86, J)),
    )
    cam.lookAt(look)
    cam.rotateZ(Math.sin(t * 0.2) * 0.012 + 0.05 * Math.sin(J * Math.PI) * (1 - fly) + 0.04 * Math.sin(D.world * 5))

    // ── light & fog follow the mood ───────────────────────────────────────
    if (fog.current) fog.current.color.lerpColors(IVORY, CHOC, D.dark)
    if (pointL.current) pointL.current.position.set(cam.position.x - 3, cam.position.y - 1, cam.position.z - 3)

    // ── yarn ball ─────────────────────────────────────────────────────────
    const rev = easeOut(S.reveal)
    const shrink = (1 - 0.55 * smooth(0.05, 0.5, J)) * (1 - smooth(0.5, 0.62, J))
    const boost = portrait ? 1.3 : 1
    const scBase = lerp(1, 1.2, S.intro) * boost
    const sc = Math.max(scBase * shrink * rev, 0.0001)
    const w = smooth(0, 0.9, D.hero)
    const heroX = portrait ? 0 : halfW * 0.38
    const heroY = portrait ? halfH * 0.27 : 0
    const mw = 1 - smooth(0, 0.04, J)
    const bob = Math.sin(t * 0.9) * 0.12 * mw
    const lx = lerp(0, heroX, 1 - S.intro)
    const ly = lerp(0, heroY, 1 - S.intro) + bob
    // while unwinding, the ball shrinks toward the point where the strand leaves it
    const jx = BALL_DIR.x * (1.2 - 1.25 * sc)
    const jy = BALL_DIR.y * (1.2 - 1.25 * sc)
    const jz = BALL_DIR.z * (1.2 - 1.25 * sc)
    const bp = ballPos.current
    bp.position.set(lerp(lx, jx, w), lerp(ly, jy, w), lerp(0, jz, w))
    bp.scale.setScalar(sc)
    bp.visible = sc > 0.02
    ballTilt.current.rotation.set(-my * 0.3 * mw + Math.sin(t * 0.5) * 0.05 * mw, mx * 0.45 * mw, 0)
    const ang = t * 0.14 + D.spin * TAU + J * TAU * 6 + (1 - rev) * TAU * 0.8
    ballSpin.current.quaternion.copy(qSpin.setFromAxisAngle(BALL_DIR, ang))

    // ── strand: unwinds, travels, coils into the magic ring ──────────────
    const p = smooth(0.04, 0.52, J)
    const { strand, flower, loose, field } = built
    strand.geo.setDrawRange(0, Math.floor(p * strand.segs) * strand.radial * 6)
    const s2 = 1 - smooth(0.52, 0.66, J)
    const sg = strandG.current
    sg.scale.setScalar(Math.max(s2, 0.0001))
    sg.rotation.z = (1 - s2) * 2.4
    sg.visible = p > 0.002 && s2 > 0.01

    // ── flower: appears from the coil, then opens ────────────────────────
    const fg = flowerG.current
    const fs = smooth(0.52, 0.68, J)
    const aside = smooth(0.8, 0.92, J)
    fg.visible = fs > 0.01
    fg.scale.setScalar(Math.max(0.8 * fs, 0.0001) * (portrait ? 1.0 : 1))
    fg.position.set(
      FLOWER_POS.x - 3.6 * aside,
      FLOWER_POS.y + 0.9 * aside + Math.sin(t * 0.8) * 0.08,
      FLOWER_POS.z - 1.0 * aside,
    )
    fg.rotation.set(-0.3 + my * 0.25, mx * 0.35 + 0.5 * aside, (1 - fs) * -2.4 + t * 0.05)
    const open = easeOutCubic(smooth(0.62, 0.8, J))
    for (let i = 0; i < flower.pivots.length; i++) {
      const pv = flower.pivots[i]
      pv.tilt.rotation.x = lerp(pv.closed, pv.open, open) + Math.sin(t * 1.1 + i) * 0.02 * open
    }

    // ── loose strands drifting around the hero ball ──────────────────────
    const hl = 1 - S.intro // 0 = intro layout, 1 = hero layout
    const ls = (1 - smooth(0, 0.12, J)) * rev * lerp(1, 0.6, hl)
    loose.group.visible = ls > 0.01
    loose.group.position.set(portrait ? 0 : -halfW * 0.42 * hl, (portrait ? halfH * 0.2 : halfH * 0.42) * hl, 0)
    loose.group.scale.setScalar(Math.max(ls, 0.0001))
    for (let i = 0; i < loose.items.length; i++) {
      const m = loose.items[i]
      const u = m.userData
      const depth = 0.3 + (u.c.z + 1.5) * 0.22
      m.position.set(-mx * depth, Math.sin(t * u.sp + u.phase) * 0.18 - my * depth * 0.6, 0)
      m.rotation.z = Math.sin(t * u.sp * 0.7 + u.phase) * 0.12
    }

    // ── the floating field of crochet objects ────────────────────────────
    field.group.visible = J > 0.7
    if (field.group.visible) {
      const n = field.items.length
      for (let i = 0; i < n; i++) {
        const m = field.items[i]
        const u = m.userData
        const k = i / n
        const a = smooth(0.74 + k * 0.09, 0.86 + k * 0.09, J)
        const bobY = Math.sin(t * u.speed + u.phase) * 0.28
        m.scale.setScalar(Math.max(u.s * a, 0.0001))
        m.position.set(u.base.x, u.base.y + bobY, u.base.z)
        m.rotation.set(u.rx + Math.sin(t * 0.3 + u.phase) * 0.2, u.ry + t * u.spin * 0.6, m.rotation.z + u.spin * 0.004 * (reduced ? 0 : 1))
      }
    }
  })

  return (
    <>
      <fog ref={fog} attach="fog" args={['#F8F3EA', 14, 62]} />
      <hemisphereLight args={['#fff3e4', '#8a6450', 0.85]} />
      <directionalLight position={[4, 5, 6]} intensity={1.9} color="#ffe6cc" />
      <directionalLight position={[-6, -2, 3]} intensity={0.7} color="#ffcfb0" />
      <pointLight ref={pointL} intensity={38} color="#ffc9a8" decay={2} />

      <group ref={ballPos}>
        <group ref={ballTilt}>
          <group ref={ballSpin}>
            <primitive object={built.ball.group} />
          </group>
        </group>
      </group>
      <group ref={strandG} position={FLOWER_POS}>
        <primitive object={built.strand.mesh} />
      </group>
      <group ref={flowerG}>
        <primitive object={built.flower.group} />
      </group>
      <primitive object={built.loose.group} />
      <primitive object={built.field.group} />
    </>
  )
}

const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3)

export default function WorldCanvas({ mode, mobile, onReady }) {
  return (
    <div className={`canvas-wrap mode-${mode}`} aria-hidden="true">
      <Canvas
        dpr={[1, mobile ? 1.5 : 1.75]}
        frameloop={mode === 'off' ? 'never' : 'always'}
        camera={{ fov: FOV, near: 0.1, far: 150, position: [0, 0, 9] }}
        gl={{ antialias: !mobile, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMappingExposure = 1.0
        }}
      >
        <Scene mobile={mobile} onReady={onReady} />
      </Canvas>
    </div>
  )
}
