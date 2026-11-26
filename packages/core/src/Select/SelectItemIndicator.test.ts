import { mount } from '@vue/test-utils'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import { Presence } from '@/Presence'
import { SelectContent, SelectItem, SelectItemIndicator, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from '.'

beforeAll(() => {
  window.HTMLElement.prototype.releasePointerCapture = vi.fn()
  window.HTMLElement.prototype.hasPointerCapture = vi.fn()
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

describe('given a Select whose items each have an indicator', () => {
  const model = ref<string>()

  let mounted: { unmount: () => void } | undefined

  function mountSelect(indicator = '') {
    const wrapper = mount(defineComponent({
      components: { SelectContent, SelectItem, SelectItemIndicator, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport },
      setup: () => ({ model, options: Array.from({ length: 50 }, (_, index) => `Option ${index + 1}`) }),
      template: `
        <SelectRoot v-model="model" :open="true">
          <SelectTrigger><SelectValue placeholder="Pick" /></SelectTrigger>
          <SelectPortal>
            <SelectContent>
              <SelectViewport>
                <SelectItem v-for="option in options" :key="option" :value="option">
                  <SelectItemText>{{ option }}</SelectItemText>
                  <SelectItemIndicator class="indicator" ${indicator}>✓</SelectItemIndicator>
                </SelectItem>
              </SelectViewport>
            </SelectContent>
          </SelectPortal>
        </SelectRoot>`,
    }), { attachTo: document.body })
    mounted = wrapper
    return wrapper
  }

  // The `Presence` of the content is the other one
  const indicatorPresences = (wrapper: ReturnType<typeof mountSelect>) =>
    wrapper.findAllComponents(SelectItemIndicator).flatMap(indicator => indicator.findAllComponents(Presence))

  beforeEach(() => {
    model.value = undefined
  })

  // Unmount, so the open Select releases its body lock and its effects stop
  afterEach(() => {
    mounted?.unmount()
    mounted = undefined
    document.body.innerHTML = ''
  })

  it('should mount a Presence for the selected item only', async () => {
    const wrapper = mountSelect()
    await nextTick()
    expect(wrapper.findAllComponents(SelectItemIndicator)).toHaveLength(50)
    // One per item before
    expect(indicatorPresences(wrapper)).toHaveLength(0)
    expect(document.querySelectorAll('.indicator')).toHaveLength(0)

    model.value = 'Option 3'
    await nextTick()
    expect(indicatorPresences(wrapper)).toHaveLength(1)
    const indicator = document.querySelector('.indicator')!
    expect(indicator.closest('[role=option]')!.textContent).toContain('Option 3')
    expect(indicator.getAttribute('data-state')).toBe('checked')
    expect(indicator.getAttribute('aria-hidden')).toBe('true')

    model.value = 'Option 7'
    // The Presence of the item that was selected goes once its exit settled
    await vi.waitFor(() => {
      const indicators = Array.from(document.querySelectorAll('.indicator'))
      expect(indicators.map(element => element.closest('[role=option]')!.textContent?.includes('Option 7'))).toEqual([true])
    })
    expect(indicatorPresences(wrapper)).toHaveLength(1)
  })

  it('should leave one comment in an item that is not selected', async () => {
    mountSelect()
    await nextTick()
    const item = document.querySelector('[role=option]')!
    expect(Array.from(item.childNodes).filter(node => node.nodeType === Node.COMMENT_NODE)).toHaveLength(1)
    expect(item.children).toHaveLength(1)
  })

  it('should keep every indicator mounted with `forceMount`', async () => {
    const wrapper = mountSelect('force-mount')
    await nextTick()
    expect(indicatorPresences(wrapper)).toHaveLength(50)
    expect(document.querySelectorAll('.indicator[data-state=unchecked]')).toHaveLength(50)

    model.value = 'Option 3'
    await nextTick()
    expect(document.querySelectorAll('.indicator[data-state=checked]')).toHaveLength(1)
    expect(document.querySelectorAll('.indicator')).toHaveLength(50)
  })
})
