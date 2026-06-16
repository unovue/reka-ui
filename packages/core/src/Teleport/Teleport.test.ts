import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import Teleport from './Teleport.vue'

describe('given default Teleport', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('teleports slot content into document.body by default', async () => {
    // Wrap in a host component so we can assert content is NOT inside the host
    const Host = defineComponent({
      setup() {
        return () => h('div', { id: 'host' }, [
          h(Teleport, { forceMount: true }, {
            default: () => h('span', { id: 'teleported' }, 'teleported content'),
          }),
        ])
      },
    })

    const wrapper = mount(Host, { attachTo: document.body })
    await nextTick()

    // Content must exist somewhere in the document
    const teleported = document.getElementById('teleported')
    expect(teleported).not.toBeNull()
    expect(teleported!.textContent).toBe('teleported content')

    // Content must NOT be inside the host div
    const host = document.getElementById('host')
    expect(host!.contains(teleported)).toBe(false)

    wrapper.unmount()
  })

  it('renders inline when disabled=true', async () => {
    const Host = defineComponent({
      setup() {
        return () => h('div', { id: 'host-disabled' }, [
          h(Teleport, { forceMount: true, disabled: true }, {
            default: () => h('span', { id: 'inline-content' }, 'inline content'),
          }),
        ])
      },
    })

    const wrapper = mount(Host, { attachTo: document.body })
    await nextTick()

    const inline = document.getElementById('inline-content')
    expect(inline).not.toBeNull()

    // Content must be INSIDE the host div
    const host = document.getElementById('host-disabled')
    expect(host!.contains(inline)).toBe(true)

    wrapper.unmount()
  })

  it('teleports to a custom container element', async () => {
    const container = document.createElement('div')
    container.id = 'custom-container'
    document.body.appendChild(container)

    const Host = defineComponent({
      setup() {
        return () => h(Teleport, { to: '#custom-container', forceMount: true }, {
          default: () => h('span', { id: 'custom-teleported' }, 'custom target'),
        })
      },
    })

    const wrapper = mount(Host, { attachTo: document.body })
    await nextTick()

    const teleported = document.getElementById('custom-teleported')
    expect(teleported).not.toBeNull()
    expect(container.contains(teleported)).toBe(true)

    wrapper.unmount()
    container.remove()
  })
})
