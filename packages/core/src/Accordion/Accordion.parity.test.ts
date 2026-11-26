import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { AccordionContent, AccordionHeader, AccordionItem, AccordionRoot, AccordionTrigger } from '.'

// Behaviour the parts had while an item rendered a `CollapsibleRoot` and the root handed its slot a
// plain object. The snapshot was taken on v2 before those changed.

async function tick() {
  await nextTick()
  await nextTick()
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 20))
  await nextTick()
}

const components = { AccordionRoot, AccordionItem, AccordionHeader, AccordionTrigger, AccordionContent }

describe('accordion vs v2', () => {
  it('consumer listeners on content and item', async () => {
    const log: string[] = []
    const wrapper = mount(defineComponent({
      components,
      setup: () => ({ log }),
      template: `<AccordionRoot type="single" collapsible default-value="a"><AccordionItem value="a" class="i" @update:open="log.push('item update:open ' + $event)" @animationend="log.push('item animationend')">
        <AccordionHeader><AccordionTrigger class="t">A</AccordionTrigger></AccordionHeader>
        <AccordionContent class="c" @animationend="log.push('content animationend')" @beforematch="log.push('content beforematch')" @animationstart="log.push('content animationstart')" @content-found="log.push('content-found')"><b class="inner">p</b></AccordionContent></AccordionItem></AccordionRoot>`,
    }), { attachTo: document.body })
    await tick()
    const content = wrapper.find('.c').element
    content.dispatchEvent(new Event('animationstart', { bubbles: true }))
    content.dispatchEvent(new Event('animationend', { bubbles: true }))
    wrapper.find('.inner').element.dispatchEvent(new Event('animationend', { bubbles: true }))
    await tick()
    await wrapper.find('.t').trigger('click')
    await tick()
    log.push(`state ${wrapper.find('.i').attributes('data-state')}`)
    content.dispatchEvent(new Event('beforematch', { bubbles: true }))
    await tick()
    await new Promise(resolve => setTimeout(resolve, 50))
    await tick()
    log.push(`state ${wrapper.find('.i').attributes('data-state')}`)
    expect(log).toMatchSnapshot()
    // The listener is called by the item, never added to its element.
    expect(wrapper.find('.i').attributes()).not.toHaveProperty('onupdate:open')
    wrapper.unmount()
  })

  it('does not report a toggle of a disabled item', async () => {
    const log: boolean[] = []
    const wrapper = mount(defineComponent({
      components,
      setup: () => ({ log }),
      template: `<AccordionRoot type="single" collapsible><AccordionItem value="a" disabled @update:open="log.push($event)">
        <AccordionHeader><AccordionTrigger class="t">A</AccordionTrigger></AccordionHeader>
        <AccordionContent>p</AccordionContent></AccordionItem></AccordionRoot>`,
    }), { attachTo: document.body })
    await wrapper.find('.t').trigger('click')
    await tick()
    expect(log).toEqual([])
    wrapper.unmount()
  })

  it('root slot props spread onto a child', async () => {
    const Child = defineComponent({
      props: ['modelValue'],
      setup: props => () => h('i', { class: 'child' }, String(props.modelValue)),
    })
    const wrapper = mount(defineComponent({
      components: { ...components, Child },
      template: `<AccordionRoot type="single" collapsible v-slot="sp"><Child v-bind="sp" /><AccordionItem value="a"><AccordionHeader><AccordionTrigger class="t">A</AccordionTrigger></AccordionHeader><AccordionContent>p</AccordionContent></AccordionItem></AccordionRoot>`,
    }), { attachTo: document.body })
    await tick()
    expect(wrapper.find('.child').text()).toBe('undefined')
    await wrapper.find('.t').trigger('click')
    await tick()
    expect(wrapper.find('.child').text()).toBe('a')
    await wrapper.find('.t').trigger('click')
    await tick()
    expect(wrapper.find('.child').text()).toBe('undefined')
    wrapper.unmount()
  })
})
