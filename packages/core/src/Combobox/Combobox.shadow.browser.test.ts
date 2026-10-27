import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, ref } from 'vue'
import { mountInShadowRoot } from '@/shared/test/shadowDom'
import { ComboboxAnchor, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxPortal, ComboboxRoot, ComboboxTrigger, ComboboxViewport } from '.'

const fruits = ['Apple', 'Banana', 'Blueberry', 'Cherry']

function mountCombobox() {
  const value = ref<string>()
  const Fixture = defineComponent({
    setup() {
      return () => h('div', { style: 'padding: 40px;' }, [
        h('button', { 'data-testid': 'outside' }, 'Outside'),
        h(ComboboxRoot, { 'modelValue': value.value, 'onUpdate:modelValue': (v: string) => { value.value = v } }, () => [
          h(ComboboxAnchor, { style: 'display: inline-flex;' }, () => [
            h(ComboboxInput, { 'data-testid': 'input', 'placeholder': 'Fruit' }),
            h(ComboboxTrigger, { 'data-testid': 'trigger' }, () => 'v'),
          ]),
          h(ComboboxPortal, null, () => h(ComboboxContent, { 'data-testid': 'content', 'position': 'popper', 'style': 'background: white; width: 160px;' }, () =>
            h(ComboboxViewport, null, () => fruits.map(fruit => h(ComboboxItem, { 'value': fruit, 'data-testid': `item-${fruit}`, 'style': 'display: block; height: 24px;' }, () => fruit))))),
        ]),
      ])
    },
  })
  return { ...mountInShadowRoot(Fixture), value }
}

describe('given a Combobox inside a shadow root, in a real browser', () => {
  // #2725: the input's blur handler resolved the content with `document.getElementById`,
  // so a mouse press on an item (which blurs the input) closed the list before the click.
  it('selects an item with the mouse', async () => {
    const { get, shadowRoot, value } = mountCombobox()

    await userEvent.click(get('input')!)
    await userEvent.keyboard('b')
    await expect.poll(() => get('content')).not.toBeNull()
    expect(get('content')!.getRootNode()).toBe(shadowRoot)
    await expect.poll(() => get('item-Apple')).toBeNull()

    await userEvent.click(get('item-Blueberry')!)
    await expect.poll(() => value.value).toBe('Blueberry')
    await expect.poll(() => get('content')).toBeNull()
  })

  it('highlights with the keyboard and wires aria-activedescendant within the shadow root', async () => {
    const { get, shadowRoot, value, activeElement } = mountCombobox()

    await userEvent.click(get('input')!)
    await userEvent.keyboard('{ArrowDown}')
    await expect.poll(() => get('content')).not.toBeNull()
    await expect.poll(() => get('input')!.getAttribute('aria-activedescendant')).toBeTruthy()
    expect(shadowRoot.getElementById(get('input')!.getAttribute('aria-activedescendant')!)).not.toBeNull()
    expect(shadowRoot.getElementById(get('input')!.getAttribute('aria-controls')!)).not.toBeNull()

    await userEvent.keyboard('{ArrowDown}{Enter}')
    await expect.poll(() => value.value).toBeTruthy()
    expect(activeElement()).toBe(get('input'))
  })

  it('closes on Escape and on an outside click', async () => {
    const { get } = mountCombobox()

    await userEvent.click(get('trigger')!)
    await expect.poll(() => get('content')).not.toBeNull()
    await userEvent.keyboard('{Escape}')
    await expect.poll(() => get('content')).toBeNull()

    await userEvent.click(get('trigger')!)
    await expect.poll(() => get('content')).not.toBeNull()
    await userEvent.click(get('outside')!)
    await expect.poll(() => get('content')).toBeNull()
  })
})
