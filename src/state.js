// Shared, mutable scroll/interaction state read by the 3D scene every frame.
// Written by GSAP ScrollTrigger + pointer listeners; never triggers React renders.
export const S = {
  mouse: { x: 0, y: 0 },
  hero: 0, // 0..1 while the hero section scrolls away
  journey: 0, // 0..1 across the pinned yarn journey
  world: 0, // 0..1 across "A world of details"
  worldActive: false,
  intro: 1, // 1 = intro layout (ball centred), 0 = hero layout
  reveal: 0, // 0..1 first appearance of the ball
  spin: 0, // extra spin impulse when entering
  entered: false,
  mode: 'stage', // 'stage' | 'world' | 'off' — which part of the page the canvas serves
  finePointer: true,
  reduced: false,
  lenis: null,
}

export const clamp01 = (v) => Math.min(1, Math.max(0, v))
export const smooth = (a, b, v) => {
  const t = clamp01((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}
export const lerp = (a, b, t) => a + (b - a) * t
