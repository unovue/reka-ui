import { describe, expect, it } from 'vitest'
import { colorToHex } from './convert'
import { isValidColor, parseColor } from './parse'

describe('parseColor', () => {
  it('clamps out-of-range channels', () => {
    expect(parseColor('rgb(300, 0, 0)')).toEqual({ space: 'rgb', r: 255, g: 0, b: 0, alpha: 1 })
    expect(parseColor('rgba(10, 20, 30, 5)')).toMatchObject({ alpha: 1 })
    expect(parseColor('hsl(400, 150%, 50%)')).toMatchObject({ h: 40, s: 100, l: 50 })
    expect(parseColor('hsl(360, 100%, 50%)')).toMatchObject({ h: 360 })
    expect(parseColor('hsb(725, 50%, 50%)')).toMatchObject({ h: 5 })
    expect(parseColor('hsb(10, 200%, 300%)')).toMatchObject({ s: 100, b: 100 })
  })

  it('rejects trailing or leading junk around functional notation', () => {
    expect(isValidColor('rgb(1, 2, 3) junk')).toBe(false)
    expect(isValidColor('xrgb(1, 2, 3)')).toBe(false)
    expect(isValidColor('rgb: rgb(1, 2, 3)')).toBe(false)
    expect(isValidColor('hsl(1, 2%, 3%) junk')).toBe(false)
    expect(isValidColor('hsb(1, 2%, 3%) junk')).toBe(false)
    expect(isValidColor('rgb(1, 2, 3)')).toBe(true)
    expect(isValidColor('  RGB(1,2,3)  ')).toBe(true)
  })
})

describe('colorToHex', () => {
  it('never emits a malformed string for out-of-range channels', () => {
    expect(colorToHex({ space: 'rgb', r: 300, g: -5, b: 0, alpha: 1 })).toBe('#ff0000')
    expect(colorToHex({ space: 'rgb', r: 0, g: 0, b: 0, alpha: 5 })).toBe('#000000')
  })
})
