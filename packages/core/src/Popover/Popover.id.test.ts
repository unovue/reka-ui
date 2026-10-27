import { render } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import { createPopoverHandle, PopoverContent, PopoverRoot, PopoverTrigger } from '.'

globalThis.ResizeObserver ??= class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function renderPopover() {
  const triggerId = ref<string | undefined>('my-trigger')
  const contentId = ref<string | undefined>('my-content')
  const utils = render(defineComponent({
    components: { PopoverRoot, PopoverTrigger, PopoverContent },
    setup: () => ({ triggerId, contentId }),
    template: `
      <PopoverRoot default-open>
        <PopoverTrigger :id="triggerId">Open</PopoverTrigger>
        <PopoverContent :id="contentId">Content</PopoverContent>
      </PopoverRoot>`,
  }))
  return {
    triggerId,
    contentId,
    trigger: () => utils.getByText('Open'),
    content: () => utils.getByRole('dialog'),
  }
}

describe('popover part ids', () => {
  it('renders the consumer ids and links trigger and content through them', async () => {
    const { trigger, content } = renderPopover()
    await nextTick()
    expect(trigger().id).toBe('my-trigger')
    expect(content().id).toBe('my-content')
    expect(trigger().getAttribute('aria-controls')).toBe('my-content')
    expect(content().getAttribute('aria-labelledby')).toBe('my-trigger')
  })

  it('follows a prop change', async () => {
    const { triggerId, contentId, trigger, content } = renderPopover()
    await nextTick()
    triggerId.value = 'next-trigger'
    contentId.value = 'next-content'
    await nextTick()
    expect(trigger().id).toBe('next-trigger')
    expect(content().id).toBe('next-content')
    expect(trigger().getAttribute('aria-controls')).toBe('next-content')
    expect(content().getAttribute('aria-labelledby')).toBe('next-trigger')
  })

  it('falls back to the generated ids when the props are removed', async () => {
    const { triggerId, contentId, trigger, content } = renderPopover()
    await nextTick()
    triggerId.value = undefined
    contentId.value = undefined
    await nextTick()
    expect(trigger().id).toMatch(/^reka-popover-.*-trigger$/)
    expect(content().id).toMatch(/^reka-popover-.*-content$/)
    expect(trigger().getAttribute('aria-controls')).toBe(content().id)
    expect(content().getAttribute('aria-labelledby')).toBe(trigger().id)
  })

  it('points a detached trigger\'s aria-controls at the content id', async () => {
    const handle = createPopoverHandle()
    const contentId = ref('my-content')
    const utils = render(defineComponent({
      components: { PopoverRoot, PopoverTrigger, PopoverContent },
      setup: () => ({ handle, contentId }),
      template: `
        <div>
          <PopoverTrigger :handle="handle" id="detached-trigger">Open</PopoverTrigger>
          <PopoverRoot :handle="handle">
            <PopoverContent :id="contentId">Content</PopoverContent>
          </PopoverRoot>
        </div>`,
    }))
    await nextTick()
    utils.getByText('Open').click()
    await nextTick()
    await nextTick()
    const trigger = utils.getByText('Open')
    expect(trigger.getAttribute('aria-controls')).toBe('my-content')
    expect(utils.getByRole('dialog').getAttribute('aria-labelledby')).toBe('detached-trigger')

    contentId.value = 'next-content'
    await nextTick()
    expect(trigger.getAttribute('aria-controls')).toBe('next-content')
  })
})
