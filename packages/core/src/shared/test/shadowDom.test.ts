import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import SwitchRoot from '@/Switch/SwitchRoot.vue'
import { getRootNode } from '../getRootNode'
import { createShadowHost } from './shadowDom'

describe('shadow DOM integration', () => {
  it('createShadowHost mounts a target whose getRootNode is the shadow root', () => {
    const { shadowRoot, mountTarget, cleanup } = createShadowHost()
    expect(getRootNode(mountTarget)).toBe(shadowRoot)
    cleanup()
  })

  it('resolves a Switch aria-label from a [for] label inside the same shadow root', async () => {
    const { shadowRoot, mountTarget, cleanup } = createShadowHost()
    const label = document.createElement('label')
    label.setAttribute('for', 'sw-shadow')
    // jsdom has no real innerText — mock it.
    Object.defineProperty(label, 'innerText', { value: 'Shadow Wifi', configurable: true })
    shadowRoot.insertBefore(label, mountTarget)

    // The document-scoped lookup CANNOT see a label inside the shadow root.
    expect(document.querySelector('[for="sw-shadow"]')).toBeNull()

    const wrapper = mount(SwitchRoot as any, { props: { id: 'sw-shadow' }, attachTo: mountTarget })
    await nextTick()
    // Root-scoped lookup finds it, so the control gets its accessible name.
    expect(shadowRoot.querySelector('button')?.getAttribute('aria-label')).toBe('Shadow Wifi')

    wrapper.unmount()
    cleanup()
  })
})
