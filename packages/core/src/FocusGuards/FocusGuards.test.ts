import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import FocusGuards from './FocusGuards.vue'

// The guard attribute used by useFocusGuards (verified in useFocusGuards.ts)
const GUARD_ATTR = '[data-reka-focus-guard]'

function countGuards(): number {
  return document.querySelectorAll(GUARD_ATTR).length
}

describe('given FocusGuards', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    // Ensure guards are cleaned up between tests
    document.querySelectorAll(GUARD_ATTR).forEach(node => node.remove())
  })

  it('adds exactly 2 guard elements to document.body on mount', async () => {
    expect(countGuards()).toBe(0)
    const wrapper = mount(FocusGuards, { attachTo: document.body })
    // watchEffect runs synchronously on mount
    expect(countGuards()).toBe(2)
    wrapper.unmount()
  })

  it('removes guard elements from document.body on unmount', async () => {
    const wrapper = mount(FocusGuards, { attachTo: document.body })
    expect(countGuards()).toBe(2)
    wrapper.unmount()
    expect(countGuards()).toBe(0)
  })

  it('does not double-add guards when two consumers are mounted', async () => {
    const wrapper1 = mount(FocusGuards, { attachTo: document.body })
    const wrapper2 = mount(FocusGuards, { attachTo: document.body })
    // useFocusGuards reuses existing guard elements (insertAdjacentElement with existing)
    expect(countGuards()).toBe(2)
    wrapper1.unmount()
    wrapper2.unmount()
  })

  it('keeps guards when only one of two consumers unmounts', async () => {
    const wrapper1 = mount(FocusGuards, { attachTo: document.body })
    const wrapper2 = mount(FocusGuards, { attachTo: document.body })
    expect(countGuards()).toBe(2)
    // Unmounting first consumer — guards must remain for the second
    wrapper1.unmount()
    expect(countGuards()).toBe(2)
    // Only after the last consumer unmounts should guards be removed
    wrapper2.unmount()
    expect(countGuards()).toBe(0)
  })

  it('renders slot content', () => {
    const wrapper = mount(FocusGuards, {
      slots: { default: '<span id="slot-content">hello</span>' },
      attachTo: document.body,
    })
    expect(document.getElementById('slot-content')).not.toBeNull()
    wrapper.unmount()
  })
})
