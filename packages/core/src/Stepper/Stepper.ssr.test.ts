import { renderToString } from '@vue/server-renderer'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick } from 'vue'
import { StepperDescription, StepperItem, StepperRoot, StepperTitle, StepperTrigger } from '.'

/** An item laid out as in the anatomy: the title and description follow the trigger. */
function createFixture(parts: { title?: boolean, description?: boolean } = { title: true, description: true }) {
  return defineComponent({
    setup() {
      return () => h(StepperRoot, { defaultValue: 1 }, () => h(StepperItem, { step: 1 }, () => [
        h(StepperTrigger, { 'data-testid': 'trigger' }, () => '1'),
        parts.title ? h(StepperTitle, () => 'Title') : null,
        parts.description ? h(StepperDescription, () => 'Desc') : null,
      ]))
    },
  })
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('given a Stepper rendered on the server', () => {
  it('names the trigger by the title and description in the server HTML', async () => {
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(createFixture()))

    const trigger = container.querySelector('[data-testid="trigger"]')!
    const titleId = container.querySelector('h4')!.id
    const descriptionId = container.querySelector('p')!.id
    expect(titleId).toBeTruthy()
    expect(descriptionId).toBeTruthy()
    expect(trigger.getAttribute('aria-labelledby')).toBe(`${titleId} ${descriptionId}`)
    expect(trigger.hasAttribute('aria-describedby')).toBe(false)
  })

  it('hydrates without a mismatch, then references only the rendered parts', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(createFixture({ title: true })))
    document.body.append(container)

    createSSRApp(createFixture({ title: true })).mount(container)
    await nextTick()

    const trigger = container.querySelector('[data-testid="trigger"]')!
    expect(trigger.getAttribute('aria-labelledby')).toBe(container.querySelector('h4')!.id)
    expect(trigger.hasAttribute('aria-describedby')).toBe(false)
    const messages = [...warn.mock.calls, ...error.mock.calls].map(args => String(args[0]))
    expect(messages.filter(message => /hydration/i.test(message))).toEqual([])
  })
})
