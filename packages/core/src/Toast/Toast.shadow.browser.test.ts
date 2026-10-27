import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, ref } from 'vue'
import { mountInShadowRoot } from '@/shared/test/shadowDom'
import { ToastAction, ToastClose, ToastDescription, ToastPortal, ToastProvider, ToastRoot, ToastTitle, ToastViewport } from '.'

function mountToasts() {
  const open = ref([true, true])
  const Fixture = defineComponent({
    setup() {
      return () => h('div', [
        h('button', { 'data-testid': 'before' }, 'Before'),
        h(ToastProvider, { duration: 60_000 }, () => [
          ...open.value.map((isOpen, index) => h(ToastRoot, {
            'key': index,
            'open': isOpen,
            'data-testid': `toast-${index}`,
            'onUpdate:open': (value: boolean) => { open.value[index] = value },
          }, () => [
            h(ToastTitle, () => `Saved ${index}`),
            h(ToastDescription, () => 'Your changes are saved'),
            h(ToastAction, { 'altText': 'Undo the change', 'data-testid': `action-${index}` }, () => 'Undo'),
            h(ToastClose, { 'aria-label': 'Close', 'data-testid': `close-${index}` }, () => '×'),
          ])),
          h(ToastPortal, null, () => h(ToastViewport, { 'data-testid': 'viewport' })),
        ]),
      ])
    },
  })
  return { ...mountInShadowRoot(Fixture), open }
}

describe('given Toasts inside a shadow root, in a real browser', () => {
  it('focuses the viewport on the F8 hotkey and tabs from the newest toast', async () => {
    const { get, activeElement, shadowRoot } = mountToasts()
    await expect.poll(() => get('toast-1')).not.toBeNull()
    expect(get('viewport')!.getRootNode()).toBe(shadowRoot)

    get('before')!.focus()
    await userEvent.keyboard('{F8}')
    await expect.poll(activeElement).toBe(get('viewport'))

    // The viewport orders tabbing from the most recent toast to the oldest.
    await userEvent.keyboard('{Tab}')
    expect(activeElement()).toBe(get('toast-1'))
    await userEvent.keyboard('{Tab}')
    expect(activeElement()).toBe(get('action-1'))
  })

  it('closes from the keyboard and keeps focus in the viewport', async () => {
    const { get, activeElement, open } = mountToasts()
    await expect.poll(() => get('close-0')).not.toBeNull()

    get('close-0')!.focus()
    await userEvent.keyboard('{Enter}')
    await expect.poll(() => open.value[0]).toBe(false)
    await expect.poll(() => get('viewport')!.contains(activeElement())).toBe(true)
  })

  it('closes on Escape', async () => {
    const { get, open } = mountToasts()
    await expect.poll(() => get('toast-1')).not.toBeNull()

    get('toast-1')!.focus()
    await userEvent.keyboard('{Escape}')
    await expect.poll(() => open.value[1]).toBe(false)
  })
})
