import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import { AccordionContent, AccordionHeader, AccordionItem, AccordionRoot, AccordionTrigger } from '.'

// `AccordionContent` renders its element with the same attributes, listeners and ref as when it
// rendered a `CollapsibleContent`, which received the content's attrs under the consumer's.

const components = { AccordionRoot, AccordionItem, AccordionHeader, AccordionTrigger, AccordionContent }
const frame = () => new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)))

describe('accordion content attrs', () => {
  it('merges consumer attrs over the content\'s own', async () => {
    const wrapper = mount(defineComponent({
      components,
      template: `<AccordionRoot type="single" collapsible default-value="a">
        <AccordionItem value="a"><AccordionHeader><AccordionTrigger>A</AccordionTrigger></AccordionHeader>
          <AccordionContent class="c" style="color: red" data-x="1" aria-label="Panel A" role="group" tabindex="-1">p</AccordionContent>
        </AccordionItem>
        <AccordionItem value="b"><AccordionHeader><AccordionTrigger>B</AccordionTrigger></AccordionHeader>
          <AccordionContent id="custom" as="section" :style="{ padding: '1px' }">q</AccordionContent>
        </AccordionItem>
        <AccordionItem value="c"><AccordionHeader><AccordionTrigger>C</AccordionTrigger></AccordionHeader>
          <AccordionContent as-child force-mount class="child"><article data-y="2">r</article></AccordionContent>
        </AccordionItem>
      </AccordionRoot>`,
    }), { attachTo: document.body })
    await nextTick()
    await nextTick()
    expect(wrapper.html()).toMatchSnapshot()
    wrapper.unmount()
  })

  it('calls content-found listeners, a `.once` one only the first time', async () => {
    const open = ref<string>()
    const found: string[] = []
    const wrapper = mount(defineComponent({
      components,
      setup: () => ({ open, found }),
      template: `<AccordionRoot v-model="open" type="single" collapsible :unmount-on-hide="false">
        <AccordionItem value="a"><AccordionHeader><AccordionTrigger>A</AccordionTrigger></AccordionHeader>
          <AccordionContent class="c" @content-found="found.push('every')" @content-found.once="found.push('once')">p</AccordionContent>
        </AccordionItem>
      </AccordionRoot>`,
    }), { attachTo: document.body })
    await nextTick()
    const content = wrapper.find('.c').element
    expect(content.getAttribute('oncontentfound')).toBeNull()
    expect(Object.keys(wrapper.find('.c').attributes())).not.toContain('oncontentfoundonce')

    content.dispatchEvent(new Event('beforematch'))
    await frame()
    await nextTick()
    expect(open.value).toBe('a')
    open.value = undefined
    await nextTick()
    content.dispatchEvent(new Event('beforematch'))
    await frame()
    await nextTick()

    expect(open.value).toBe('a')
    expect(found).toEqual(['every', 'once', 'every'])
    wrapper.unmount()
  })

  it('exposes the content element on its ref', async () => {
    const content = ref()
    const wrapper = mount(defineComponent({
      components,
      setup: () => ({ content }),
      template: `<AccordionRoot type="single" default-value="a">
        <AccordionItem value="a"><AccordionHeader><AccordionTrigger>A</AccordionTrigger></AccordionHeader>
          <AccordionContent ref="content" class="c">p</AccordionContent>
        </AccordionItem>
      </AccordionRoot>`,
    }), { attachTo: document.body })
    await nextTick()
    expect(content.value.element).toBe(wrapper.find('.c').element)
    expect(content.value.$el).toBe(wrapper.find('.c').element)
    wrapper.unmount()
  })
})
