import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, isRef, ref, watchEffect } from 'vue'
import { autoResetRef, createTimeout, onNextFrame, Timeout } from './timeout'

describe('timeout', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('runs once after the delay, and restarts on `start`', () => {
    const callback = vi.fn()
    const timeout = new Timeout(callback, 100)
    timeout.start()
    vi.advanceTimersByTime(60)
    timeout.start()
    vi.advanceTimersByTime(60)
    expect(callback).not.toHaveBeenCalled()
    expect(timeout.isPending).toBe(true)
    vi.advanceTimersByTime(40)
    expect(callback).toHaveBeenCalledTimes(1)
    expect(timeout.isPending).toBe(false)
  })

  it('reads a reactive delay at start', () => {
    const callback = vi.fn()
    const delay = ref(100)
    const timeout = new Timeout(callback, delay)
    delay.value = 10
    timeout.start()
    vi.advanceTimersByTime(10)
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('`clear` cancels, and the scope clears it on dispose', () => {
    const callback = vi.fn()
    const scope = effectScope()
    const timeout = scope.run(() => createTimeout(callback, 100))!
    timeout.start()
    scope.stop()
    vi.advanceTimersByTime(200)
    expect(callback).not.toHaveBeenCalled()
  })
})

describe('autoResetRef', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('is a ref that resets to its initial value after the delay since the last write', () => {
    const search = autoResetRef('', 1000)
    expect(isRef(search)).toBe(true)
    search.value = 'a'
    vi.advanceTimersByTime(600)
    search.value = 'ab'
    vi.advanceTimersByTime(600)
    expect(search.value).toBe('ab')
    vi.advanceTimersByTime(400)
    expect(search.value).toBe('')
  })

  it('is reactive', () => {
    const flag = autoResetRef(false, 300)
    const seen: boolean[] = []
    const stop = watchEffect(() => {
      seen.push(flag.value)
    }, { flush: 'sync' })
    flag.value = true
    vi.advanceTimersByTime(300)
    stop()
    expect(seen).toEqual([false, true, false])
  })

  it('drops a pending reset with its scope (the value stays)', () => {
    const scope = effectScope()
    const flag = scope.run(() => autoResetRef(false, 300))!
    flag.value = true
    scope.stop()
    vi.advanceTimersByTime(300)
    expect(flag.value).toBe(true)
  })
})

describe('onNextFrame', () => {
  it('runs every callback queued in a frame from one `requestAnimationFrame`', async () => {
    const raf = vi.spyOn(window, 'requestAnimationFrame')
    const calls: number[] = []
    onNextFrame(() => calls.push(1))
    onNextFrame(() => calls.push(2))
    onNextFrame(() => calls.push(3))
    expect(raf).toHaveBeenCalledTimes(1)
    await new Promise(resolve => requestAnimationFrame(resolve))
    expect(calls).toEqual([1, 2, 3])
    raf.mockRestore()
  })

  it('schedules again after a synchronous `requestAnimationFrame` flushed the queue', () => {
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0)
      return 0
    })
    const calls: number[] = []
    onNextFrame(() => calls.push(1))
    onNextFrame(() => calls.push(2))
    expect(calls).toEqual([1, 2])
    raf.mockRestore()
  })
})
