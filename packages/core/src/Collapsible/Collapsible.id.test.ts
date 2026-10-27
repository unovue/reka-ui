import { render } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from '.'

function renderCollapsible() {
  const triggerId = ref<string | undefined>('my-trigger')
  const contentId = ref<string | undefined>('my-content')
  const utils = render(defineComponent({
    components: { CollapsibleRoot, CollapsibleTrigger, CollapsibleContent },
    setup: () => ({ triggerId, contentId }),
    template: `
      <CollapsibleRoot default-open>
        <CollapsibleTrigger :id="triggerId">Toggle</CollapsibleTrigger>
        <CollapsibleContent :id="contentId">Content</CollapsibleContent>
      </CollapsibleRoot>`,
  }))
  const trigger = () => utils.getByRole('button')
  const content = () => utils.getByText('Content')
  return { triggerId, contentId, trigger, content }
}

describe('collapsible part ids', () => {
  it('renders the consumer ids and points aria-controls at the content id', async () => {
    const { trigger, content } = renderCollapsible()
    await nextTick()
    expect(trigger().id).toBe('my-trigger')
    expect(content().id).toBe('my-content')
    expect(trigger().getAttribute('aria-controls')).toBe('my-content')
  })

  it('follows a prop change', async () => {
    const { triggerId, contentId, trigger, content } = renderCollapsible()
    triggerId.value = 'next-trigger'
    contentId.value = 'next-content'
    await nextTick()
    expect(trigger().id).toBe('next-trigger')
    expect(content().id).toBe('next-content')
    expect(trigger().getAttribute('aria-controls')).toBe('next-content')
  })

  it('falls back to a generated content id when the prop is removed', async () => {
    const { contentId, trigger, content } = renderCollapsible()
    contentId.value = undefined
    await nextTick()
    expect(content().id).toMatch(/^reka-collapsible-content-/)
    expect(trigger().getAttribute('aria-controls')).toBe(content().id)
  })
})
