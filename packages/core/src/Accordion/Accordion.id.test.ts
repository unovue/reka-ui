import { render } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import { AccordionContent, AccordionHeader, AccordionItem, AccordionRoot, AccordionTrigger } from '.'

function renderAccordion() {
  const triggerId = ref<string | undefined>('my-trigger')
  const contentId = ref<string | undefined>('my-content')
  const utils = render(defineComponent({
    components: { AccordionRoot, AccordionItem, AccordionHeader, AccordionTrigger, AccordionContent },
    setup: () => ({ triggerId, contentId }),
    template: `
      <AccordionRoot type="single" default-value="one">
        <AccordionItem value="one">
          <AccordionHeader>
            <AccordionTrigger :id="triggerId">One</AccordionTrigger>
          </AccordionHeader>
          <AccordionContent :id="contentId">Content</AccordionContent>
        </AccordionItem>
      </AccordionRoot>`,
  }))
  const trigger = () => utils.getByRole('button')
  const content = () => utils.getByRole('region')
  return { triggerId, contentId, trigger, content }
}

describe('accordion part ids', () => {
  it('renders the consumer ids and links trigger and content through them', async () => {
    const { trigger, content } = renderAccordion()
    await nextTick()
    expect(trigger().id).toBe('my-trigger')
    expect(content().id).toBe('my-content')
    expect(trigger().getAttribute('aria-controls')).toBe('my-content')
    expect(content().getAttribute('aria-labelledby')).toBe('my-trigger')
  })

  it('follows a prop change', async () => {
    const { triggerId, contentId, trigger, content } = renderAccordion()
    triggerId.value = 'next-trigger'
    contentId.value = 'next-content'
    await nextTick()
    expect(trigger().id).toBe('next-trigger')
    expect(content().id).toBe('next-content')
    expect(trigger().getAttribute('aria-controls')).toBe('next-content')
    expect(content().getAttribute('aria-labelledby')).toBe('next-trigger')
  })

  it('falls back to generated ids when the props are removed', async () => {
    const { triggerId, contentId, trigger, content } = renderAccordion()
    triggerId.value = undefined
    contentId.value = undefined
    await nextTick()
    expect(trigger().id).toMatch(/^reka-accordion-trigger-/)
    expect(content().getAttribute('aria-labelledby')).toBe(trigger().id)
    expect(trigger().getAttribute('aria-controls')).toBe(content().id)
  })
})
