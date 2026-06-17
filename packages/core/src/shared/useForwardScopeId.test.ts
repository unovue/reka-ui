import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ScopedCheckbox from '@/Checkbox/story/_ScopedCheckbox.vue'

function scopeIdOf(el: Element): string | undefined {
  return el.getAttributeNames().find(name => name.startsWith('data-v-'))
}

describe('useForwardScopeId', () => {
  // A multi-root component loses Vue's automatic parent scope-id fallthrough, which
  // would break consumer `<style scoped>` targeting the component's root. The forwarded
  // scope id must land on the interactive control so scoped styles keep working.
  it('forwards the parent scope id onto a multi-root component root', () => {
    const wrapper = mount(ScopedCheckbox, { attachTo: document.body })

    const marker = wrapper.find('.marker').element
    const button = wrapper.find('button').element
    const parentScopeId = scopeIdOf(marker)

    expect(parentScopeId).toBeTruthy()
    expect(button.hasAttribute(parentScopeId!)).toBe(true)

    wrapper.unmount()
  })
})
