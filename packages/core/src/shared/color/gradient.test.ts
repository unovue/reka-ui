import { describe, expect, it } from 'vitest'
import { getAreaBackgroundStyle, getSliderGradient } from './gradient'
import { parseColor } from './parse'

// ─────────────────────────────────────────────────────────────────────────────
// getSliderGradient
// ─────────────────────────────────────────────────────────────────────────────

describe('getSliderGradient', () => {
  describe('hue channel', () => {
    it('should return full rainbow spectrum', () => {
      const red = parseColor('#ff0000')
      const gradient = getSliderGradient(red, 'hue', 'hsl')
      expect(gradient).toContain('#ff0000') // red
      expect(gradient).toContain('#ffff00') // yellow
      expect(gradient).toContain('#00ff00') // green
      expect(gradient).toContain('#00ffff') // cyan
      expect(gradient).toContain('#0000ff') // blue
      expect(gradient).toContain('#ff00ff') // magenta
    })

    it('should use linear-gradient', () => {
      const red = parseColor('#ff0000')
      expect(getSliderGradient(red, 'hue', 'hsl')).toContain('linear-gradient')
    })
  })

  describe('saturation channel', () => {
    it('should return gray-to-color gradient for HSL', () => {
      const red = parseColor('hsl(0, 100%, 50%)')
      const gradient = getSliderGradient(red, 'saturation', 'hsl')
      expect(gradient).toContain('linear-gradient')
      expect(gradient).toContain('hsl(0, 0%, 50%)') // desaturated = gray
      expect(gradient).toContain('hsl(0, 100%, 50%)') // full red
    })

    it('should return gray-to-color gradient for HSB', () => {
      const red = parseColor('hsb(0, 100%, 100%)')
      const gradient = getSliderGradient(red, 'saturation', 'hsb')
      expect(gradient).toContain('linear-gradient')
      expect(gradient).toContain('hsl(0, 0%, 50%)')
      expect(gradient).toContain('hsl(0, 100%, 50%)')
    })
  })

  describe('lightness channel', () => {
    it('should span from black through color to white', () => {
      const red = parseColor('hsl(0, 100%, 50%)')
      const gradient = getSliderGradient(red, 'lightness', 'hsl')
      expect(gradient).toContain('hsl(0, 100%, 0%)') // black
      expect(gradient).toContain('hsl(0, 100%, 50%)') // pure red
      expect(gradient).toContain('hsl(0, 100%, 100%)') // white
    })
  })

  describe('brightness channel', () => {
    it('should span from black to full-brightness color', () => {
      const red = parseColor('hsb(0, 100%, 100%)')
      const gradient = getSliderGradient(red, 'brightness', 'hsb')
      expect(gradient).toContain('rgb(0, 0, 0)') // black at B=0
      expect(gradient).toContain('rgb(255, 0, 0)') // pure red at B=100
    })
  })

  describe('rGB channels', () => {
    it('should return red gradient holding g/b constant', () => {
      const color = parseColor('#808080') // rgb(128, 128, 128)
      const gradient = getSliderGradient(color, 'red', 'rgb')
      expect(gradient).toContain('rgb(0, 128, 128)') // r=0
      expect(gradient).toContain('rgb(255, 128, 128)') // r=255
    })

    it('should return green gradient holding r/b constant', () => {
      const color = parseColor('#808080')
      const gradient = getSliderGradient(color, 'green', 'rgb')
      expect(gradient).toContain('rgb(128, 0, 128)') // g=0
      expect(gradient).toContain('rgb(128, 255, 128)') // g=255
    })

    it('should return blue gradient holding r/g constant', () => {
      const color = parseColor('#808080')
      const gradient = getSliderGradient(color, 'blue', 'rgb')
      expect(gradient).toContain('rgb(128, 128, 0)') // b=0
      expect(gradient).toContain('rgb(128, 128, 255)') // b=255
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// getAreaBackgroundStyle — Hue-based pickers (no blend mode, transparent stacking)
// ─────────────────────────────────────────────────────────────────────────────

describe('getAreaBackgroundStyle', () => {
  describe('hue(x) / Saturation(y) — HSL', () => {
    const color = parseColor('hsl(180, 100%, 50%)')

    it('includes the full hue rainbow as bottom layer', () => {
      const style = getAreaBackgroundStyle(color, 'hue', 'saturation', 'hsl')
      expect(style.backgroundImage).toContain(
        'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
      )
    })

    it('overlays transparent-to-gray fade (top=full sat, bottom=desaturated)', () => {
      const style = getAreaBackgroundStyle(color, 'hue', 'saturation', 'hsl')
      // gray = hsl(H, 0%, 50%) = rgb(128,128,128) — independent of hue
      expect(style.backgroundImage).toContain('linear-gradient(to bottom, transparent, rgb(128, 128, 128))')
    })

    it('does not use any CSS blend mode', () => {
      const style = getAreaBackgroundStyle(color, 'hue', 'saturation', 'hsl')
      expect(style.backgroundBlendMode).toBeUndefined()
    })

    it('does not set a solid background color', () => {
      const style = getAreaBackgroundStyle(color, 'hue', 'saturation', 'hsl')
      expect(style.backgroundColor).toBeUndefined()
    })

    it('gray stop is rgb(128,128,128) regardless of hue (S=0, L=50 is always neutral)', () => {
      const red = parseColor('hsl(0, 100%, 50%)')
      const green = parseColor('hsl(120, 100%, 50%)')
      expect(getAreaBackgroundStyle(red, 'hue', 'saturation', 'hsl').backgroundImage).toContain('rgb(128, 128, 128)')
      expect(getAreaBackgroundStyle(green, 'hue', 'saturation', 'hsl').backgroundImage).toContain('rgb(128, 128, 128)')
    })
  })

  describe('hue(x) / Lightness(y) — HSL', () => {
    const color = parseColor('hsl(180, 100%, 50%)')

    it('includes the full hue rainbow as bottom layer', () => {
      const style = getAreaBackgroundStyle(color, 'hue', 'lightness', 'hsl')
      expect(style.backgroundImage).toContain(
        'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
      )
    })

    it('overlays black → transparent → white for the lightness axis', () => {
      const style = getAreaBackgroundStyle(color, 'hue', 'lightness', 'hsl')
      // L=0 → black (bottom), L=50 → transparent (shows hue), L=100 → white (top)
      expect(style.backgroundImage).toContain('linear-gradient(to top, #000000, transparent, #ffffff)')
    })

    it('does not use any CSS blend mode', () => {
      const style = getAreaBackgroundStyle(color, 'hue', 'lightness', 'hsl')
      expect(style.backgroundBlendMode).toBeUndefined()
    })

    it('does not set a solid background color', () => {
      const style = getAreaBackgroundStyle(color, 'hue', 'lightness', 'hsl')
      expect(style.backgroundColor).toBeUndefined()
    })
  })

  describe('hue(x) / Brightness(y) — HSB', () => {
    const color = parseColor('hsb(180, 100%, 100%)')

    it('includes the full hue rainbow as bottom layer', () => {
      const style = getAreaBackgroundStyle(color, 'hue', 'brightness', 'hsb')
      expect(style.backgroundImage).toContain(
        'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
      )
    })

    it('overlays black → transparent for the brightness axis', () => {
      const style = getAreaBackgroundStyle(color, 'hue', 'brightness', 'hsb')
      // B=0 → black (bottom), B=100 → transparent (shows hue, top)
      expect(style.backgroundImage).toContain('linear-gradient(to top, #000000, transparent)')
    })

    it('does not use any CSS blend mode', () => {
      const style = getAreaBackgroundStyle(color, 'hue', 'brightness', 'hsb')
      expect(style.backgroundBlendMode).toBeUndefined()
    })

    it('does not set a solid background color', () => {
      const style = getAreaBackgroundStyle(color, 'hue', 'brightness', 'hsb')
      expect(style.backgroundColor).toBeUndefined()
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Saturation-based pickers
  // ─────────────────────────────────────────────────────────────────────────

  describe('saturation(x) / Lightness(y) — HSL', () => {
    it('uses pure hue (S=100, L=50) as the background color', () => {
      const red = parseColor('hsl(0, 100%, 50%)')
      const style = getAreaBackgroundStyle(red, 'saturation', 'lightness', 'hsl')
      expect(style.backgroundColor).toBe('rgb(255, 0, 0)')
    })

    it('saturation gradient starts at gray (#808080) — NOT white', () => {
      const red = parseColor('hsl(0, 100%, 50%)')
      const style = getAreaBackgroundStyle(red, 'saturation', 'lightness', 'hsl')
      // S=0 at L=50 is gray (rgb(128,128,128)), not white
      expect(style.backgroundImage).toContain('linear-gradient(to right, rgb(128, 128, 128), transparent)')
    })

    it('lightness gradient spans black → transparent → white', () => {
      const red = parseColor('hsl(0, 100%, 50%)')
      const style = getAreaBackgroundStyle(red, 'saturation', 'lightness', 'hsl')
      // L=0 → black, L=50 → transparent (pure hue), L=100 → white
      expect(style.backgroundImage).toContain('linear-gradient(to top, #000000, transparent, #ffffff)')
    })

    it('background color reflects the input hue', () => {
      const green = parseColor('hsl(120, 100%, 50%)')
      const style = getAreaBackgroundStyle(green, 'saturation', 'lightness', 'hsl')
      expect(style.backgroundColor).toBe('rgb(0, 255, 0)')
    })

    it('gray stop is always rgb(128,128,128) regardless of hue', () => {
      const blue = parseColor('hsl(240, 100%, 50%)')
      const style = getAreaBackgroundStyle(blue, 'saturation', 'lightness', 'hsl')
      expect(style.backgroundImage).toContain('rgb(128, 128, 128)')
    })
  })

  describe('saturation(x) / Brightness(y) — HSB', () => {
    it('uses pure hue (S=100, B=100) as the background color', () => {
      const red = parseColor('hsb(0, 100%, 100%)')
      const style = getAreaBackgroundStyle(red, 'saturation', 'brightness', 'hsb')
      expect(style.backgroundColor).toBe('rgb(255, 0, 0)')
    })

    it('saturation gradient starts at white (S=0 + B=100 = white in HSB)', () => {
      const red = parseColor('hsb(0, 100%, 100%)')
      const style = getAreaBackgroundStyle(red, 'saturation', 'brightness', 'hsb')
      expect(style.backgroundImage).toContain('linear-gradient(to right, #ffffff, transparent)')
    })

    it('brightness gradient fades black → transparent', () => {
      const red = parseColor('hsb(0, 100%, 100%)')
      const style = getAreaBackgroundStyle(red, 'saturation', 'brightness', 'hsb')
      expect(style.backgroundImage).toContain('linear-gradient(to top, #000000, transparent)')
    })

    it('background color reflects the input hue', () => {
      const cyan = parseColor('hsb(180, 100%, 100%)')
      const style = getAreaBackgroundStyle(cyan, 'saturation', 'brightness', 'hsb')
      expect(style.backgroundColor).toBe('rgb(0, 255, 255)')
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // RGB 2-D pickers — screen blend mode, z-channel background
  // ─────────────────────────────────────────────────────────────────────────

  describe('rGB Red(x) / Green(y)', () => {
    const purple = parseColor('#7f007f') // rgb(127, 0, 127)

    it('uses screen blend mode', () => {
      expect(getAreaBackgroundStyle(purple, 'red', 'green', 'rgb').backgroundBlendMode).toBe('screen')
    })

    it('background is the constant blue z-channel value', () => {
      expect(getAreaBackgroundStyle(purple, 'red', 'green', 'rgb').backgroundColor).toBe('rgb(0, 0, 127)')
    })

    it('horizontal gradient: black → full red (x-axis)', () => {
      const style = getAreaBackgroundStyle(purple, 'red', 'green', 'rgb')
      expect(style.backgroundImage).toContain('linear-gradient(to right, rgb(0, 0, 0), rgb(255, 0, 0))')
    })

    it('vertical gradient: black at bottom → full green at top (y-axis, correct direction)', () => {
      const style = getAreaBackgroundStyle(purple, 'red', 'green', 'rgb')
      expect(style.backgroundImage).toContain('linear-gradient(to top, rgb(0, 0, 0), rgb(0, 255, 0))')
    })

    it('background is black when z-channel (blue) = 0', () => {
      const red = parseColor('#ff0000') // blue=0
      expect(getAreaBackgroundStyle(red, 'red', 'green', 'rgb').backgroundColor).toBe('rgb(0, 0, 0)')
    })
  })

  describe('rGB Red(x) / Blue(y)', () => {
    const purple = parseColor('#7f007f')

    it('uses screen blend mode', () => {
      expect(getAreaBackgroundStyle(purple, 'red', 'blue', 'rgb').backgroundBlendMode).toBe('screen')
    })

    it('background is the constant green z-channel (0 here)', () => {
      expect(getAreaBackgroundStyle(purple, 'red', 'blue', 'rgb').backgroundColor).toBe('rgb(0, 0, 0)')
    })

    it('horizontal gradient: black → full red', () => {
      const style = getAreaBackgroundStyle(purple, 'red', 'blue', 'rgb')
      expect(style.backgroundImage).toContain('linear-gradient(to right, rgb(0, 0, 0), rgb(255, 0, 0))')
    })

    it('vertical gradient: black at bottom → full blue at top', () => {
      const style = getAreaBackgroundStyle(purple, 'red', 'blue', 'rgb')
      expect(style.backgroundImage).toContain('linear-gradient(to top, rgb(0, 0, 0), rgb(0, 0, 255))')
    })
  })

  describe('rGB Green(x) / Blue(y)', () => {
    const purple = parseColor('#7f007f') // rgb(127, 0, 127) — red=127

    it('uses screen blend mode', () => {
      expect(getAreaBackgroundStyle(purple, 'green', 'blue', 'rgb').backgroundBlendMode).toBe('screen')
    })

    it('background is the constant red z-channel', () => {
      expect(getAreaBackgroundStyle(purple, 'green', 'blue', 'rgb').backgroundColor).toBe('rgb(127, 0, 0)')
    })

    it('horizontal gradient: black → full green', () => {
      const style = getAreaBackgroundStyle(purple, 'green', 'blue', 'rgb')
      expect(style.backgroundImage).toContain('linear-gradient(to right, rgb(0, 0, 0), rgb(0, 255, 0))')
    })

    it('vertical gradient: black at bottom → full blue at top', () => {
      const style = getAreaBackgroundStyle(purple, 'green', 'blue', 'rgb')
      expect(style.backgroundImage).toContain('linear-gradient(to top, rgb(0, 0, 0), rgb(0, 0, 255))')
    })
  })

  describe('rGB swapped axes — Green(x) / Red(y)', () => {
    it('assigns x-gradient horizontally and y-gradient vertically', () => {
      const purple = parseColor('#7f007f')
      const style = getAreaBackgroundStyle(purple, 'green', 'red', 'rgb')

      expect(style.backgroundColor).toBe('rgb(0, 0, 127)') // z=blue=127
      expect(style.backgroundImage).toContain('linear-gradient(to right, rgb(0, 0, 0), rgb(0, 255, 0))') // x=green
      expect(style.backgroundImage).toContain('linear-gradient(to top, rgb(0, 0, 0), rgb(255, 0, 0))') // y=red
    })
  })
})
