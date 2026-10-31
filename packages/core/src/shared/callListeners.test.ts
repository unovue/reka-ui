import { describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, getCurrentInstance, h, nextTick } from 'vue'
import { callListeners } from './callListeners'

function run(listener: unknown, ...args: unknown[]) {
  const errors: { error: unknown, info: string }[] = []
  const app = createApp(defineComponent({
    setup() {
      callListeners(listener, getCurrentInstance(), args)
      return () => h('div')
    },
  }))
  app.config.errorHandler = (error, _, info) => errors.push({ error, info })
  app.mount(document.createElement('div'))
  app.unmount()
  return errors
}

describe('callListeners', () => {
  it('passes the arguments to a function, and to each one in an array', () => {
    const first = vi.fn()
    const second = vi.fn()
    run(first, 1, 'a')
    run([first, second], 2)
    expect(first.mock.calls).toEqual([[1, 'a'], [2]])
    expect(second.mock.calls).toEqual([[2]])
  })

  it('does nothing without a listener', () => {
    expect(run(undefined)).toEqual([])
  })

  it('keeps going after a listener throws, and reports it to the app', () => {
    const boom = new Error('boom')
    const next = vi.fn()
    const errors = run([() => {
      throw boom
    }, next])
    expect(next).toHaveBeenCalledOnce()
    expect(errors).toHaveLength(1)
    expect(errors[0].error).toBe(boom)
    expect(errors[0].info).toContain('component event handler')
  })

  it('reports a listener\'s rejection to the app', async () => {
    const boom = new Error('boom')
    const errors = run(() => Promise.reject(boom))
    await nextTick()
    await Promise.resolve()
    expect(errors.map(e => e.error)).toEqual([boom])
  })
})
