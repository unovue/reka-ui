import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { useComposing } from './useComposing'

const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36'

function stubUserAgent(ua: string) {
  Object.defineProperty(window.navigator, 'userAgent', { value: ua, configurable: true })
}

function restoreUserAgent() {
  // remove the own property so the jsdom prototype getter takes over again
  delete (window.navigator as { userAgent?: string }).userAgent
}

function compositionUpdate(data: string) {
  return new CompositionEvent('compositionupdate', { data })
}

describe('useComposing', () => {
  afterEach(() => {
    restoreUserAgent()
  })

  it('should defer input while composing before any compositionupdate', () => {
    const { shouldDeferInput, handleCompositionStart } = useComposing()
    expect(shouldDeferInput.value).toBe(false)
    handleCompositionStart()
    expect(shouldDeferInput.value).toBe(true)
  })

  it('should process plain-text composition live on Android (soft-keyboard autocorrect)', () => {
    stubUserAgent(ANDROID_UA)
    const { shouldDeferInput, handleCompositionStart, handleCompositionUpdate } = useComposing()
    handleCompositionStart()
    handleCompositionUpdate(compositionUpdate('Br'))
    expect(shouldDeferInput.value).toBe(false)
  })

  it('should keep deferring plain-text composition off Android (e.g. desktop Pinyin preedit)', () => {
    const { shouldDeferInput, handleCompositionStart, handleCompositionUpdate } = useComposing()
    handleCompositionStart()
    handleCompositionUpdate(compositionUpdate('xiang'))
    expect(shouldDeferInput.value).toBe(true)
  })

  it.each([
    ['Han', '香'],
    ['Hiragana', 'かん'],
    ['Katakana', 'カナ'],
    ['Hangul syllable', '한'],
    ['Hangul jamo', 'ㅂ'],
    ['Bopomofo', 'ㄅㄆ'],
  ])('should defer IME-script composition even on Android (%s)', (_, data) => {
    stubUserAgent(ANDROID_UA)
    const { shouldDeferInput, handleCompositionStart, handleCompositionUpdate } = useComposing()
    handleCompositionStart()
    handleCompositionUpdate(compositionUpdate(data))
    expect(shouldDeferInput.value).toBe(true)
  })

  it('should keep the previous classification on empty compositionupdate data', () => {
    stubUserAgent(ANDROID_UA)
    const { shouldDeferInput, handleCompositionStart, handleCompositionUpdate } = useComposing()
    handleCompositionStart()

    handleCompositionUpdate(compositionUpdate('Br'))
    handleCompositionUpdate(compositionUpdate(''))
    expect(shouldDeferInput.value).toBe(false)

    handleCompositionUpdate(compositionUpdate('香'))
    handleCompositionUpdate(compositionUpdate(''))
    expect(shouldDeferInput.value).toBe(true)
  })

  it('should reset composing state and call onEnd after compositionend', async () => {
    stubUserAgent(ANDROID_UA)
    const onEnd = vi.fn()
    const { isComposing, shouldDeferInput, handleCompositionStart, handleCompositionUpdate, handleCompositionEnd } = useComposing(onEnd)
    handleCompositionStart()
    handleCompositionUpdate(compositionUpdate('Br'))

    const endEvent = new CompositionEvent('compositionend', { data: 'Br' })
    handleCompositionEnd(endEvent)
    await nextTick()
    expect(isComposing.value).toBe(false)
    expect(shouldDeferInput.value).toBe(false)
    expect(onEnd).toHaveBeenCalledWith(endEvent)

    // a new composition session starts deferred again
    handleCompositionStart()
    expect(shouldDeferInput.value).toBe(true)
  })
})
