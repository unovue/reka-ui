import { describe, expect, it } from 'vitest'
import { computeSwipeReleaseScalar, getDisplacement } from './utils'

describe('getDisplacement', () => {
  it('returns positive when moving in the dismiss direction', () => {
    expect(getDisplacement('down', 0, 50)).toBe(50)
    expect(getDisplacement('up', 0, -50)).toBe(50)
    expect(getDisplacement('right', 50, 0)).toBe(50)
    expect(getDisplacement('left', -50, 0)).toBe(50)
  })

  it('returns negative when moving against the dismiss direction', () => {
    expect(getDisplacement('down', 0, -50)).toBe(-50)
    expect(getDisplacement('up', 0, 50)).toBe(-50)
  })
})

describe('computeSwipeReleaseScalar', () => {
  // Baseline case: bottom drawer halfway down, decent release velocity.
  // Ported invariants from BaseUI `DrawerViewport.tsx:resolveSwipeRelease`.

  it('returns null when velocity is below MIN_SWIPE_RELEASE_VELOCITY (0.2)', () => {
    const scalar = computeSwipeReleaseScalar({
      direction: 'down',
      size: 500,
      axisDelta: 100,
      snapPointOffset: 0,
      releaseVelocity: 0.1,
    })
    expect(scalar).toBeNull()
  })

  it('returns null when moving against the dismiss direction', () => {
    // 'down' drawer with negative axisDelta → translation is negative →
    // directionalVelocity is negative → below MIN_SWIPE_RELEASE_VELOCITY.
    const scalar = computeSwipeReleaseScalar({
      direction: 'down',
      size: 500,
      axisDelta: 100,
      snapPointOffset: 0,
      releaseVelocity: -1,
    })
    expect(scalar).toBeNull()
  })

  it('returns null when remaining distance is 0', () => {
    // Dragged the full size → remainingDistance = 0
    const scalar = computeSwipeReleaseScalar({
      direction: 'down',
      size: 500,
      axisDelta: 500,
      snapPointOffset: 0,
      releaseVelocity: 1,
    })
    expect(scalar).toBeNull()
  })

  it('returns a scalar in [0.1, 1] for a reasonable release', () => {
    const scalar = computeSwipeReleaseScalar({
      direction: 'down',
      size: 500,
      axisDelta: 100,
      snapPointOffset: 0,
      releaseVelocity: 1,
    })
    expect(scalar).not.toBeNull()
    expect(scalar!).toBeGreaterThanOrEqual(0.1)
    expect(scalar!).toBeLessThanOrEqual(1)
  })

  it('short remaining + high velocity → near the minimum scalar (fast)', () => {
    // remainingDistance = 500 - (0 + 50) = 450, velocity 4 (max)
    // → durationMs = clamp(450/4, 80, 360) = 112.5
    // → normalized = (112.5-80)/(360-80) = 0.116
    // → scalar = 0.1 + 0.116 * 0.9 = 0.204
    const scalar = computeSwipeReleaseScalar({
      direction: 'down',
      size: 500,
      axisDelta: 50,
      snapPointOffset: 0,
      releaseVelocity: 4,
    })
    expect(scalar).not.toBeNull()
    expect(scalar!).toBeLessThan(0.3)
  })

  it('long remaining + low velocity → near the maximum scalar (slow)', () => {
    // remainingDistance = 500 - 20 = 480, velocity = 0.21 (just above min)
    // → duration = 480/0.21 ≈ 2285, clamped to 360 (max)
    // → normalized = 1 → scalar = 1
    const scalar = computeSwipeReleaseScalar({
      direction: 'down',
      size: 500,
      axisDelta: 20,
      snapPointOffset: 0,
      releaseVelocity: 0.21,
    })
    expect(scalar).not.toBeNull()
    expect(scalar!).toBeCloseTo(1, 1)
  })

  it('handles up-drawer sign convention', () => {
    // 'up' drawer: user drags UP (negative axisDelta). releaseVelocity is also
    // negative (moving up). directionalVelocity = -releaseVelocity = positive.
    const scalar = computeSwipeReleaseScalar({
      direction: 'up',
      size: 500,
      axisDelta: -100,
      snapPointOffset: 0,
      releaseVelocity: -1,
    })
    expect(scalar).not.toBeNull()
    expect(scalar!).toBeGreaterThanOrEqual(0.1)
    expect(scalar!).toBeLessThanOrEqual(1)
  })

  it('respects snapPointOffset when computing translation', () => {
    // With snapPointOffset=100, a 'down' drawer starts from translation 100
    // (already partially down). Adding axisDelta=50 → translation=150.
    // remainingDistance = 500 - 150 = 350, velocity 2.
    // duration = 350/2 = 175, clamped [80,360]=175, normalized=(175-80)/280=0.339
    // scalar = 0.1 + 0.339*0.9 ≈ 0.405
    const scalar = computeSwipeReleaseScalar({
      direction: 'down',
      size: 500,
      axisDelta: 50,
      snapPointOffset: 100,
      releaseVelocity: 2,
    })
    expect(scalar).not.toBeNull()
    expect(scalar!).toBeCloseTo(0.405, 1)
  })

  it('respects snapPointOffset for horizontal (right) drawers', () => {
    // A 'right' drawer must seed translation with snapPointOffset just like
    // 'down'. With the same numbers as the 'down' snapPointOffset case the
    // resulting scalar should match (translation = 100 + 50 = 150).
    const right = computeSwipeReleaseScalar({
      direction: 'right',
      size: 500,
      axisDelta: 50,
      snapPointOffset: 100,
      releaseVelocity: 2,
    })
    const down = computeSwipeReleaseScalar({
      direction: 'down',
      size: 500,
      axisDelta: 50,
      snapPointOffset: 100,
      releaseVelocity: 2,
    })
    expect(right).not.toBeNull()
    expect(right).toBeCloseTo(down!, 5)
  })

  it('respects snapPointOffset for horizontal (left) drawers', () => {
    // 'left' mirrors 'up': drag left is negative axisDelta and negative
    // velocity, and snapPointOffset seeds a negative base translation.
    const left = computeSwipeReleaseScalar({
      direction: 'left',
      size: 500,
      axisDelta: -50,
      snapPointOffset: 100,
      releaseVelocity: -2,
    })
    const up = computeSwipeReleaseScalar({
      direction: 'up',
      size: 500,
      axisDelta: -50,
      snapPointOffset: 100,
      releaseVelocity: -2,
    })
    expect(left).not.toBeNull()
    expect(left).toBeCloseTo(up!, 5)
  })
})
