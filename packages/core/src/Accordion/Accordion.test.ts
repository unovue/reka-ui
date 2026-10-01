import type { VueWrapper } from '@vue/test-utils'
import { findByText, fireEvent } from '@testing-library/vue'
import { renderToString } from '@vue/server-renderer'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { createSSRApp, defineComponent, h, nextTick } from 'vue'
import { ConfigProvider } from '@/ConfigProvider'
import {
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionRoot,
  AccordionTrigger,
} from '.'
import Accordion from './story/_Accordion.vue'

const AccordionHydrationFixture = defineComponent({
  setup() {
    const items = ['One', 'Two']
    let count = 0
    const useId = () => `nuxt-${++count}`

    return () =>
      h(ConfigProvider, { useId }, () =>
        h(
          AccordionRoot,
          { type: 'single', collapsible: true },
          () => items.map(item =>
            h(AccordionItem, { value: item }, () => [
              h(AccordionHeader, () =>
                h(AccordionTrigger, () => `Trigger ${item}`)),
              h(AccordionContent, () => `Content ${item}`),
            ]),
          ),
        ))
  },
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ssr hydration', () => {
  it('uses ConfigProvider ids when Vue app id prefixes differ', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Nuxt prerender can produce a different Vue useId app prefix than the
    // hydrating client. ConfigProvider's useId must remain the stable source.
    const serverApp = createSSRApp(AccordionHydrationFixture)
    serverApp.config.idPrefix = 'v-1'

    const container = document.createElement('div')
    container.innerHTML = await renderToString(serverApp)
    document.body.innerHTML = ''
    document.body.append(container)

    expect(container.innerHTML).toContain('id="reka-accordion-trigger-nuxt-1"')
    expect(container.innerHTML).toContain('id="reka-collapsible-content-nuxt-2"')
    const triggerId = container.querySelector('button')?.id
    const contentId = container.querySelector('[role="region"]')?.id

    const clientApp = createSSRApp(AccordionHydrationFixture)
    clientApp.config.idPrefix = 'v-0'
    clientApp.mount(container)
    await nextTick()

    expect(container.querySelector('button')?.id).toBe(triggerId)
    expect(container.querySelector('[role="region"]')?.id).toBe(contentId)

    const warnings = warn.mock.calls.flat().join('\n')
    expect(warnings).not.toContain('Hydration attribute mismatch')
    expect(error.mock.calls.flat().join('\n')).not.toContain('Hydration completed but contains mismatches')
  })
})

describe('given a single Accordion', () => {
  let wrapper: VueWrapper<InstanceType<typeof Accordion>>
  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(Accordion, { attachTo: document.body })
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  describe('when navigating by keyboard', () => {
    beforeEach(() => {
      const trigger = wrapper.find('button')
      trigger.element.focus()
    })

    describe('on `ArrowDown`', () => {
      it('should move focus to the next trigger', () => {
        fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' })
        const trigger = wrapper.findAll('button')[1].element
        expect(trigger).toBe(document.activeElement)
      })

      it('should move focus to the first item if at the end', () => {
        const triggers = wrapper.findAll('button').map(i => i.element)
        triggers[3].focus()
        fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' })
        expect(triggers[0]).toBe(document.activeElement)
      })
    })

    describe('on `ArrowUp`', () => {
      it('should move focus to the previous trigger', () => {
        const triggers = wrapper.findAll('button').map(i => i.element)
        triggers[2].focus()
        fireEvent.keyDown(document.activeElement!, { key: 'ArrowUp' })
        expect(triggers[1]).toBe(document.activeElement)
      })

      it('should move focus to the last item if at the beginning', () => {
        const triggers = wrapper.findAll('button').map(i => i.element)
        triggers[0].focus()
        fireEvent.keyDown(document.activeElement!, { key: 'ArrowUp' })
        expect(triggers[3]).toBe(document.activeElement)
      })
    })

    describe('on `Home`', () => {
      it('should move focus to the first trigger', () => {
        fireEvent.keyDown(document.activeElement!, { key: 'Home' })
        expect(wrapper.findAll('button')[0].element).toBe(document.activeElement)
      })
    })

    describe('on `End`', () => {
      it('should move focus to the last trigger', () => {
        fireEvent.keyDown(document.activeElement!, { key: 'End' })
        expect(wrapper.findAll('button')[3].element).toBe(document.activeElement)
      })
    })
  })

  describe('when clicking a trigger', () => {
    let trigger: HTMLButtonElement
    let contentOne: HTMLElement | null

    beforeEach(async () => {
      trigger = wrapper.find('button').element
      fireEvent.click(trigger)
      contentOne = await findByText(wrapper.element as HTMLElement, 'Content One')
    })

    it('should show the content', () => {
      expect(document.body.innerHTML).toContain(contentOne?.innerHTML)
    })

    it('should call update:modelValue', () => {
      expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toBe('One')
    })

    describe('then clicking the trigger again', () => {
      it('should not close the content', () => {
        fireEvent.click(trigger)
        expect(document.body.innerHTML).toContain(contentOne?.innerHTML)
      })

      it('should not call update:modelValue', () => {
        fireEvent.click(trigger)
        expect(wrapper.emitted('update:modelValue')?.length).toBe(1)
      })
    })

    describe('then clicking another trigger', () => {
      beforeEach(() => {
        const trigger = wrapper.findAll('button')[1].element
        fireEvent.click(trigger)
      })

      it('should show the new content', async () => {
        const contentTwo = await findByText(wrapper.element as HTMLElement, 'Content Two')
        expect(document.body.innerHTML).toContain(contentTwo?.innerHTML)
      })

      it('should call update:modelValue', () => {
        expect(wrapper.emitted('update:modelValue')?.[1]?.[0]).toBe('Two')
      })

      it('should hide the previous content', () => {
        expect(document.body.innerHTML).not.toContain(contentOne?.innerHTML)
      })
    })
  })
})

describe('given a multiple Accordion', () => {
  let wrapper: VueWrapper<InstanceType<typeof Accordion>>
  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(Accordion, { props: { type: 'multiple' }, attachTo: document.body })
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  describe('when navigating by keyboard', () => {
    beforeEach(() => {
      wrapper.find('button').element.focus()
    })

    describe('on `ArrowDown`', () => {
      it('should move focus to the next trigger', () => {
        fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' })
        expect(wrapper.findAll('button')[1].element).toBe(document.activeElement)
      })
    })

    describe('on `ArrowUp`', () => {
      it('should move focus to the previous trigger', () => {
        fireEvent.keyDown(document.activeElement!, { key: 'ArrowUp' })
        expect(wrapper.findAll('button')[3].element).toBe(document.activeElement)
      })
    })

    describe('on `Home`', () => {
      it('should move focus to the first trigger', () => {
        fireEvent.keyDown(document.activeElement!, { key: 'Home' })
        expect(wrapper.findAll('button')[0].element).toBe(document.activeElement)
      })
    })

    describe('on `End`', () => {
      it('should move focus to the last trigger', () => {
        fireEvent.keyDown(document.activeElement!, { key: 'End' })
        expect(wrapper.findAll('button')[3].element).toBe(document.activeElement)
      })
    })
  })

  describe('when clicking a trigger', () => {
    let trigger: HTMLButtonElement
    let contentOne: HTMLElement | null

    beforeEach(async () => {
      trigger = wrapper.find('button').element
      fireEvent.click(trigger)
      contentOne = await findByText(wrapper.element as HTMLElement, 'Content One')
    })

    it('should show the content', () => {
      expect(document.body.innerHTML).toContain(contentOne?.innerHTML)
    })

    it('should call update:modelValue', () => {
      expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toMatchObject(['One'])
    })

    describe('then clicking the trigger again', () => {
      beforeEach(() => {
        fireEvent.click(trigger)
      })

      it('should hide the content', () => {
        expect(document.body.innerHTML).not.toContain(contentOne?.innerHTML)
      })

      it('should call update:modelValue', () => {
        expect(wrapper.emitted('update:modelValue')?.[1]?.[0]).toMatchObject([])
      })
    })

    describe('then clicking another trigger', () => {
      beforeEach(() => {
        const trigger = wrapper.findAll('button')[1].element
        fireEvent.click(trigger)
      })

      it('should show the new content', async () => {
        const contentTwo = await findByText(wrapper.element as HTMLElement, 'Content Two')
        expect(document.body.innerHTML).toContain(contentTwo.innerHTML)
      })

      it('should call onValueChange', () => {
        expect(wrapper.emitted('update:modelValue')?.[1]?.[0]).toMatchObject(['One', 'Two'])
      })

      it('should not hide the previous content', () => {
        expect(document.body.innerHTML).toContain(contentOne?.innerHTML)
      })
    })
  })
})
