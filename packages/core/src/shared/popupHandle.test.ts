import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { computed, defineComponent, h, nextTick, ref, shallowRef } from 'vue'
import { createPopoverHandle, PopoverRoot, PopoverTrigger } from '@/Popover'
import { injectPopoverRootContext } from '@/Popover/PopoverRoot.vue'
import { createPopupRootStore, getPopupRootStore } from './popupHandle'

globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe('createPopupRootStore without a handle', () => {
  it('builds no handle machinery and reads the handle-less values', () => {
    const open = ref(false)
    const store = createPopupRootStore({
      handle: () => undefined,
      open: computed(() => open.value),
      setState: (value) => {
        open.value = value
        return true
      },
      baseId: 'p',
      defaultTriggerId: 'first',
    })
    expect(store.handle.value).toBeUndefined()
    expect(store.activeTriggerId.value).toBe('first')
    expect(store.activeTriggerElement.value).toBeUndefined()
    expect(store.anchor.value).toBeUndefined()
    expect(store.payload.value).toBeUndefined()
    expect(store.contentId).toBe('p-content')
    expect(store.fallbackTriggerId).toBe('p-trigger')
    expect(store.containsTrigger(document.body)).toBe(false)
    expect((store as any).full).toBeUndefined()

    store.closePopup()
    store.reconcile()
    expect((store as any).full).toBeUndefined()
  })

  it('follows a controlled `triggerId`', () => {
    const triggerId = ref<string | null>('a')
    const store = createPopupRootStore({
      handle: () => undefined,
      open: ref(false),
      setState: () => true,
      baseId: 'p',
      triggerId: () => triggerId.value,
    })
    expect(store.activeTriggerId.value).toBe('a')
    triggerId.value = null
    expect(store.activeTriggerId.value).toBeNull()
  })

  it('a Popover without a handle never builds the full store', async () => {
    let handleStore: any
    const Probe = defineComponent(() => {
      handleStore = getPopupRootStore(injectPopoverRootContext())
      return () => null
    })
    const wrapper = mount(defineComponent(() => () =>
      h(PopoverRoot, null, () => [h(PopoverTrigger, null, () => 'Open'), h(Probe)])), { attachTo: document.body })
    await nextTick()
    await wrapper.find('button').trigger('click')
    await nextTick()
    expect(handleStore).toBeDefined()
    expect(handleStore.full).toBeUndefined()
    wrapper.unmount()
  })

  it('switches to the handle once the Root receives one after mount', async () => {
    const handle = shallowRef<ReturnType<typeof createPopoverHandle> | undefined>()
    const wrapper = mount(defineComponent(() => () =>
      h(PopoverRoot, { handle: handle.value }, {
        default: ({ activeTriggerId }: { activeTriggerId: string | null }) => [
          h('span', { 'data-testid': 'owner' }, String(activeTriggerId)),
          h(PopoverTrigger, { id: 'own' }, () => 'Open'),
        ],
      })), { attachTo: document.body })
    await nextTick()
    expect(wrapper.find('[data-testid="owner"]').text()).toBe('null')

    handle.value = createPopoverHandle()
    await nextTick()
    await nextTick()
    await wrapper.find('button').trigger('click')
    await nextTick()
    expect(handle.value.isOpen).toBe(true)
    expect(wrapper.find('[data-testid="owner"]').text()).toBe('own')
    wrapper.unmount()
  })
})
