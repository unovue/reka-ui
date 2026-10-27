import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, h, Teleport as NativeTeleport, nextTick, onMounted, ref } from 'vue'
import { ConfigProvider } from '@/ConfigProvider'
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

  it('uses the ConfigProvider `teleportTo` target as the default', async () => {
    const container = document.createElement('div')
    container.id = 'config-container'
    document.body.appendChild(container)

    const Host = defineComponent({
      setup() {
        return () => h(ConfigProvider, { teleportTo: '#config-container' }, {
          default: () => h(Teleport, { forceMount: true }, {
            default: () => h('span', { id: 'config-teleported' }, 'config target'),
          }),
        })
      },
    })

    const wrapper = mount(Host, { attachTo: document.body })
    await nextTick()

    const teleported = document.getElementById('config-teleported')
    expect(teleported).not.toBeNull()
    expect(container.contains(teleported)).toBe(true)

    wrapper.unmount()
    container.remove()
  })

  it('prefers an explicit `to` prop over the ConfigProvider `teleportTo`', async () => {
    const configContainer = document.createElement('div')
    configContainer.id = 'config-fallback'
    const explicitContainer = document.createElement('div')
    explicitContainer.id = 'explicit-target'
    document.body.append(configContainer, explicitContainer)

    const Host = defineComponent({
      setup() {
        return () => h(ConfigProvider, { teleportTo: '#config-fallback' }, {
          default: () => h(Teleport, { to: '#explicit-target', forceMount: true }, {
            default: () => h('span', { id: 'override-teleported' }, 'override target'),
          }),
        })
      },
    })

    const wrapper = mount(Host, { attachTo: document.body })
    await nextTick()

    const teleported = document.getElementById('override-teleported')
    expect(explicitContainer.contains(teleported)).toBe(true)
    expect(configContainer.contains(teleported)).toBe(false)

    wrapper.unmount()
    configContainer.remove()
    explicitContainer.remove()
  })
})

describe('given a Teleport inside a shadow root (#2725)', () => {
  function shadowHost() {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const shadowRoot = host.attachShadow({ mode: 'open' })
    const mountTarget = document.createElement('div')
    shadowRoot.appendChild(mountTarget)
    return { host, shadowRoot, mountTarget }
  }

  it.each([false, true])('keeps the content in the shadow root by default (forceMount: %s)', async (forceMount) => {
    const { host, shadowRoot, mountTarget } = shadowHost()
    const wrapper = mount(defineComponent({
      setup: () => () => h('div', { id: 'app' }, h(Teleport, { forceMount }, {
        default: () => h('span', { id: 'in-shadow' }, 'content'),
      })),
    }), { attachTo: mountTarget })
    await nextTick()

    const content = shadowRoot.getElementById('in-shadow')
    expect(content?.parentNode).toBe(shadowRoot)
    expect(shadowRoot.getElementById('app')!.contains(content)).toBe(false)
    expect(document.getElementById('in-shadow')).toBeNull()

    wrapper.unmount()
    expect(shadowRoot.getElementById('in-shadow')).toBeNull()
    host.remove()
  })

  it('resolves a ConfigProvider `teleportTo` selector inside the shadow root first', async () => {
    const { host, shadowRoot, mountTarget } = shadowHost()
    const portalRoot = document.createElement('div')
    portalRoot.id = 'portal-root'
    shadowRoot.appendChild(portalRoot)
    const wrapper = mount(defineComponent({
      setup: () => () => h(ConfigProvider, { teleportTo: '#portal-root' }, {
        default: () => h(Teleport, null, { default: () => h('span', { id: 'in-portal-root' }, 'content') }),
      }),
    }), { attachTo: mountTarget })
    await nextTick()

    expect(portalRoot.contains(shadowRoot.getElementById('in-portal-root'))).toBe(true)
    wrapper.unmount()
    host.remove()
  })

  it('resolves a deferred selector against an element rendered later in the shadow root', async () => {
    const { host, shadowRoot, mountTarget } = shadowHost()
    const show = ref(false)
    const wrapper = mount(defineComponent({
      setup: () => () => h('div', show.value
        ? [h(Teleport, { to: '#later', defer: true, forceMount: true }, () => h('span', { id: 'deferred' })), h('div', { id: 'later' })]
        : []),
    }), { attachTo: mountTarget })

    show.value = true
    await nextTick()
    await nextTick()
    expect(shadowRoot.querySelector('#later #deferred')).not.toBeNull()
    wrapper.unmount()
    host.remove()
  })

  it('still honours an explicit `to="body"`', async () => {
    const { host, mountTarget } = shadowHost()
    const wrapper = mount(defineComponent({
      setup: () => () => h(Teleport, { to: 'body' }, { default: () => h('span', { id: 'in-body' }, 'content') }),
    }), { attachTo: mountTarget })
    await nextTick()

    expect(document.getElementById('in-body')?.parentNode).toBe(document.body)
    wrapper.unmount()
    host.remove()
  })
})

describe('given a force-mounted Teleport on the app\'s first client render', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('renders in place synchronously when disabled', () => {
    const wrapper = mount(defineComponent({
      setup: () => () => h('div', { id: 'host' }, h(Teleport, { forceMount: true, disabled: true }, () => h('span', { id: 'inline' }))),
    }), { attachTo: document.body })

    expect(document.getElementById('host')!.contains(document.getElementById('inline'))).toBe(true)
    wrapper.unmount()
  })

  it('renders synchronously into an explicit element `to`', () => {
    const target = document.createElement('div')
    document.body.appendChild(target)
    const wrapper = mount(defineComponent({
      setup: () => () => h(Teleport, { forceMount: true, to: target }, () => h('span', { id: 'in-target' })),
    }), { attachTo: document.body })

    expect(target.querySelector('#in-target')).not.toBeNull()
    wrapper.unmount()
  })

  it('renders synchronously into a ConfigProvider `teleportTo` element', () => {
    const target = document.createElement('div')
    document.body.appendChild(target)
    const wrapper = mount(defineComponent({
      setup: () => () => h(ConfigProvider, { teleportTo: target }, () => h(Teleport, { forceMount: true }, () => h('span', { id: 'in-target' }))),
    }), { attachTo: document.body })

    expect(target.querySelector('#in-target')).not.toBeNull()
    wrapper.unmount()
  })

  // Documented in the v3 migration guide: the default target depends on the
  // root the portal renders in, which is unknown until it mounts.
  it('mounts the content after the parent\'s onMounted when `to` is the default', async () => {
    let seenInParentMounted: HTMLElement | undefined | 'unset' = 'unset'
    const content = ref<HTMLElement>()
    const wrapper = mount(defineComponent({
      setup() {
        onMounted(() => {
          seenInParentMounted = content.value
        })
        return () => h(Teleport, { forceMount: true }, () => h('span', { ref: content, id: 'content' }))
      },
    }), { attachTo: document.body })

    expect(seenInParentMounted).toBeUndefined()
    await nextTick()
    expect(content.value).toBe(document.getElementById('content'))
    wrapper.unmount()
  })
})

describe('given a force-mounted Teleport created inside a native Teleport', () => {
  function shadowTarget() {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const shadowRoot = host.attachShadow({ mode: 'open' })
    const target = document.createElement('div')
    shadowRoot.appendChild(target)
    return { host, shadowRoot, target }
  }

  function mountBehindNativeTeleport(to: HTMLElement, nativeProps: Record<string, unknown> = {}) {
    const show = ref(false)
    const wrapper = mount(defineComponent({
      setup: () => () => h('div', show.value
        ? [h(NativeTeleport, { to, ...nativeProps }, [h(Teleport, { forceMount: true }, () => h('span', { id: 'force-mounted' }))])]
        : []),
    }), { attachTo: document.body })
    return { show, wrapper }
  }

  /** Records whether `#force-mounted` is ever inserted under `document.body` itself (outside any shadow root). */
  function watchBody() {
    const seen: Node[] = []
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if ((node as Element).id === 'force-mounted' || (node as Element).querySelector?.('#force-mounted'))
            seen.push(node)
        }
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })
    return { seen, stop: () => observer.disconnect() }
  }

  // The parent component's DOM sits in the document; the portal renders in the
  // native Teleport's target, so the ancestor walk stops at the Teleport.
  it('uses the native Teleport target\'s shadow root, never mounting into body', async () => {
    const { host, shadowRoot, target } = shadowTarget()
    const body = watchBody()
    const { show, wrapper } = mountBehindNativeTeleport(target)

    show.value = true
    await nextTick()
    await nextTick()
    body.stop()

    expect(shadowRoot.getElementById('force-mounted')?.parentNode).toBe(shadowRoot)
    expect(body.seen).toEqual([])
    wrapper.unmount()
    host.remove()
  })

  it('waits for the mount when the native Teleport target is deferred', async () => {
    const { host, shadowRoot, target } = shadowTarget()
    const body = watchBody()
    const { show, wrapper } = mountBehindNativeTeleport(target, { defer: true })

    show.value = true
    await nextTick()
    await nextTick()
    body.stop()

    expect(shadowRoot.getElementById('force-mounted')?.parentNode).toBe(shadowRoot)
    expect(body.seen).toEqual([])
    wrapper.unmount()
    host.remove()
  })
})
