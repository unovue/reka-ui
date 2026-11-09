import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { h, nextTick } from 'vue'
import { CheckboxGroupRoot, CheckboxRoot } from '.'

async function mountForm(groupProps: { name?: string, required: boolean, disabled?: boolean, defaultValue: string[] }) {
  let submits = 0
  const wrapper = mount({
    render: () => h('form', {
      onSubmit: (event: Event) => {
        event.preventDefault()
        submits++
      },
    }, [
      h(CheckboxGroupRoot, groupProps, () => [
        h(CheckboxRoot, { 'value': 'apple', 'aria-label': 'apple' }),
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

  it('submits an empty required group when the group is disabled', async () => {
    const mounted = await mountForm({ required: true, disabled: true, defaultValue: [] })
    wrapper = mounted.wrapper
    mounted.form.requestSubmit()
    expect(mounted.getSubmits()).toBe(1)
  })

  it('submits once the user checks an item in an unnamed required group', async () => {
    const mounted = await mountForm({ required: true, defaultValue: [] })
    wrapper = mounted.wrapper
    // checkValidity, not requestSubmit: a blocked submit opens the browser's validation popup,
    // which in Firefox on Linux swallows the next click.
    expect(mounted.form.checkValidity()).toBe(false)
    await userEvent.click(mounted.wrapper.get('[aria-label="apple"]').element)
    // The required hidden input goes away after the re-render; poll rather than count ticks.
    await expect.poll(() => mounted.form.checkValidity()).toBe(true)
    mounted.form.requestSubmit()
    expect(mounted.getSubmits()).toBe(1)
  })
})
