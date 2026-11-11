import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h } from 'vue'
import { TooltipProvider, TooltipRoot, TooltipTrigger } from '.'

function mountInForm(triggerProps: Record<string, unknown> = {}) {
  const onSubmit = vi.fn((event: Event) => event.preventDefault())
  const wrapper = mount(defineComponent({
    setup: () => () => h('form', { onSubmit }, [
      h('input', { 'aria-label': 'name', 'data-testid': 'field' }),
      h(TooltipProvider, null, () => h(TooltipRoot, null, () => [
        h(TooltipTrigger, { 'data-testid': 'trigger', ...triggerProps }, () => 'info'),
      ])),
    ]),
  }), { attachTo: document.body })
  const get = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!
  return { wrapper, onSubmit, get }
}

describe('given a TooltipTrigger inside a form, in a real browser', () => {
  let unmount: (() => void) | undefined
  afterEach(() => {
    unmount?.()
    unmount = undefined
  })

  it('does not submit the form when the trigger is clicked', async () => {
    const { wrapper, onSubmit, get } = mountInForm()
    unmount = () => wrapper.unmount()

    await userEvent.click(get('trigger'))

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('does not become the default button for Enter in a field', async () => {
    const { wrapper, onSubmit, get } = mountInForm()
    unmount = () => wrapper.unmount()

    await userEvent.click(get('field'))
    await userEvent.keyboard('{Enter}')

    // A lone text field still submits implicitly, but not through the trigger.
    await expect.poll(() => onSubmit.mock.calls.length).toBe(1)
    expect((onSubmit.mock.calls[0][0] as SubmitEvent).submitter).toBeNull()
  })

  it('still submits when the trigger has an explicit type="submit"', async () => {
    const { wrapper, onSubmit, get } = mountInForm({ type: 'submit' })
    unmount = () => wrapper.unmount()

    await userEvent.click(get('trigger'))

    expect(onSubmit).toHaveBeenCalledTimes(1)
  })
})
