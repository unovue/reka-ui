import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { FieldControl, FieldError, FieldRoot } from '.'

const components = { FieldRoot, FieldControl, FieldError }

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

const mounted: ReturnType<typeof mount>[] = []

function mountField(props: { validate: (...args: any[]) => any, debounce?: number }) {
  const wrapper = mount({
    components,
    props: ['validate', 'debounce'],
    template: `
      <FieldRoot name="username" :validate="validate" validation-mode="onChange" :validation-debounce-time="debounce">
        <FieldControl />
        <FieldError v-slot="{ errors }">{{ errors[0] }}</FieldError>
      </FieldRoot>
    `,
  }, { props, attachTo: document.body })
  mounted.push(wrapper)
  return wrapper
}

afterEach(() => {
  while (mounted.length) {
    try {
      mounted.pop()!.unmount()
    }
    catch {}
  }
})

describe('field validation: out-of-order async results', () => {
  function setup() {
    const pending: ReturnType<typeof deferred<string | null>>[] = []
    const validate = vi.fn(() => {
      const d = deferred<string | null>()
      pending.push(d)
      return d.promise
    })
    const wrapper = mountField({ validate })
    return { wrapper, validate, pending }
  }

  it('a slower, older result does not replace a newer one', async () => {
    const { wrapper, validate, pending } = setup()
    const input = wrapper.find('input')
    await input.setValue('a')
    await input.setValue('ab')
    expect(validate).toHaveBeenCalledTimes(2)

    pending[1].resolve(null)
    await flushPromises()
    pending[0].resolve('Too short')
    await flushPromises()

    expect(wrapper.text()).not.toContain('Too short')
  })

  it('the newest result is shown', async () => {
    const { wrapper, validate, pending } = setup()
    const input = wrapper.find('input')
    await input.setValue('a')
    await input.setValue('ab')
    expect(validate).toHaveBeenCalledTimes(2)

    pending[0].resolve(null)
    await flushPromises()
    pending[1].resolve('Taken')
    await flushPromises()

    expect(wrapper.text()).toContain('Taken')
  })
})

describe('field validation: debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('waits for the debounce time', async () => {
    const validate = vi.fn(() => 'Nope')
    const wrapper = mountField({ validate, debounce: 200 })
    await wrapper.find('input').setValue('a')
    expect(validate).not.toHaveBeenCalled()

    vi.advanceTimersByTime(199)
    expect(validate).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    await nextTick()
    expect(validate).toHaveBeenCalledTimes(1)
    expect(validate.mock.calls[0][0]).toBe('a')
    expect(wrapper.text()).toContain('Nope')
  })

  it('restarts on each change and validates the latest value', async () => {
    const validate = vi.fn(() => 'Nope')
    const wrapper = mountField({ validate, debounce: 200 })
    const input = wrapper.find('input')
    await input.setValue('a')
    vi.advanceTimersByTime(150)
    await input.setValue('ab')
    vi.advanceTimersByTime(150)
    expect(validate).not.toHaveBeenCalled()

    vi.advanceTimersByTime(50)
    expect(validate).toHaveBeenCalledTimes(1)
    expect(validate.mock.calls[0][0]).toBe('ab')
  })

  it('an empty value is validated at once', async () => {
    const validate = vi.fn(() => 'Nope')
    const wrapper = mountField({ validate, debounce: 200 })
    const input = wrapper.find('input')
    await input.setValue('a')
    vi.advanceTimersByTime(200)
    expect(validate).toHaveBeenCalledTimes(1)

    await input.setValue('')
    expect(validate).toHaveBeenCalledTimes(2)
  })

  it('a pending debounce does not fire after unmount', async () => {
    const validate = vi.fn(() => 'Nope')
    const wrapper = mountField({ validate, debounce: 200 })
    await wrapper.find('input').setValue('a')
    wrapper.unmount()
    vi.advanceTimersByTime(1000)
    expect(validate).not.toHaveBeenCalled()
  })
})
