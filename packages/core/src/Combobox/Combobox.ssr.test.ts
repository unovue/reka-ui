// @vitest-environment node
// The `items` prop on the server: no DOM, so no rendered item can supply a label.
import { renderToString } from '@vue/server-renderer'
import { describe, expect, it } from 'vitest'
import { createSSRApp, defineComponent, h } from 'vue'
import { ComboboxAnchor, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxPortal, ComboboxRoot, ComboboxValue, ComboboxViewport, createComboboxItems } from '.'

const data = [{ id: 'a', name: 'Apple' }, { id: 'b', name: 'Banana' }]
interface Fruit { id: string, name: string }
const options = { getValue: (fruit: Fruit) => fruit.id, getLabel: (fruit: Fruit) => fruit.name }
const fruits = createComboboxItems(data, options)

function fixture(rootProps: Record<string, unknown>, valueProps: Record<string, unknown> | null = null) {
  return defineComponent({
    setup: () => () => h(ComboboxRoot, rootProps, () => [
      h('p', h(ComboboxValue, valueProps)),
      h('ul', h(ComboboxValue, null, {
        default: ({ selectedLabels }: { selectedLabels: string[] }) => selectedLabels.map(label => h('li', `chip:${label}`)),
      })),
      h(ComboboxAnchor, () => h(ComboboxInput)),
      h(ComboboxPortal, () => h(ComboboxContent, () => h(ComboboxViewport, () =>
        data.map(fruit => h(ComboboxItem, { value: fruit.id }, () => fruit.name))))),
    ]),
  })
}

const render = (rootProps: Record<string, unknown>, valueProps?: Record<string, unknown>) => renderToString(createSSRApp(fixture(rootProps, valueProps)))

describe('given a closed Combobox on the server', () => {
  it('has no document to read', () => {
    expect(typeof document).toBe('undefined')
  })

  it('renders the value itself in the input without `items`', async () => {
    const html = await render({ defaultValue: 'b' })
    expect(html).toContain('value="b"')
    expect(html).not.toContain('Banana')
  })

  it('renders the selected label from `items` in the input', async () => {
    const html = await render({ defaultValue: 'b', items: fruits })
    expect(html).toContain('value="Banana"')
    expect(html).not.toContain('role="option"')
  })

  it('renders the label from a grouped collection', async () => {
    const items = createComboboxItems([{ label: 'Fruits', items: data }], options)
    expect(await render({ defaultValue: 'b', items })).toContain('value="Banana"')
  })

  it('renders the `label` key of an object value, and the label of the item `by` matches', async () => {
    expect(await render({ defaultValue: { id: 2, label: 'Two' } })).toContain('value="Two"')
    expect(await render({ defaultValue: { id: 2 }, by: 'id', items: [{ id: 2, label: 'Two' }] })).toContain('value="Two"')
  })

  it('renders the text of `ComboboxValue`: the label, or the placeholder', async () => {
    expect(await render({ defaultValue: 'b', items: fruits })).toContain('<p><!--[-->Banana<!--]--></p>')
    expect(await render({ items: fruits }, { placeholder: 'Pick a fruit' })).toContain('<p><!--[-->Pick a fruit<!--]--></p>')
  })

  it('renders the labels of a multiple selection through `ComboboxValue`', async () => {
    const html = await render({ defaultValue: ['b', 'a'], multiple: true, items: fruits })
    expect(html).toContain('<p><!--[-->Banana, Apple<!--]--></p>')
    expect(html).toContain('<li>chip:Banana</li><li>chip:Apple</li>')
  })
})
