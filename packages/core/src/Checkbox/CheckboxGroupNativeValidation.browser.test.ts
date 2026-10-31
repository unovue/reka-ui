import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { h, nextTick } from 'vue'
import { CheckboxGroupRoot, CheckboxRoot } from '.'

async function mountForm(groupProps: { name?: string, required: boolean, defaultValue: string[] }) {
  let submits = 0
  const wrapper = mount({
    render: () => h('form', {
      onSubmit: (event: Event) => {
        event.preventDefault()
        submits++
      },
    }, [
      h(CheckboxGroupRoot, groupProps, () => [
        h(CheckboxRoot, { value: 'apple' }),
        h(CheckboxRoot, { value: 'pear' }),
      ]),
    ]),
  }, { attachTo: document.body })
  await nextTick()
  return {
    wrapper,
    form: wrapper.get('form').element as HTMLFormElement,
    getSubmits: () => submits,
  }
}

describe('checkboxGroup native validation', () => {
  let wrapper: { unmount: () => void } | undefined
  afterEach(() => wrapper?.unmount())

  it.each([undefined, 'fruits'])('blocks submit while a required group is empty (name: %s)', async (name) => {
    const mounted = await mountForm({ name, required: true, defaultValue: [] })
    wrapper = mounted.wrapper
    mounted.form.requestSubmit()
    expect(mounted.getSubmits()).toBe(0)
  })

  it('submits a required group with a checked item and adds no unnamed form fields', async () => {
    const mounted = await mountForm({ required: true, defaultValue: ['apple'] })
    wrapper = mounted.wrapper
    mounted.form.requestSubmit()
    expect(mounted.getSubmits()).toBe(1)
    expect([...new FormData(mounted.form).keys()]).toEqual([])
  })
})
