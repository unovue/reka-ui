// @vitest-environment node
// The `items` prop on the server: no DOM, so no rendered item can supply a label.
import { renderToString } from '@vue/server-renderer'
import { describe, expect, it } from 'vitest'
import { createSSRApp, defineComponent, h } from 'vue'
import { ComboboxAnchor, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxPortal, ComboboxRoot, ComboboxViewport } from '.'

const fruits = [{ value: 'a', label: 'Apple' }, { value: 'b', label: 'Banana' }]

function fixture(rootProps: Record<string, unknown>) {
  return defineComponent({
    setup: () => () => h(ComboboxRoot, rootProps, {
      default: ({ selectedLabels }: { selectedLabels: string[] }) => [
        h('ul', selectedLabels.map(label => h('li', `chip:${label}`))),
        h(ComboboxAnchor, () => h(ComboboxInput)),
        h(ComboboxPortal, () => h(ComboboxContent, () => h(ComboboxViewport, () =>
          fruits.map(fruit => h(ComboboxItem, { value: fruit.value }, () => fruit.label))))),
      ],
    }),
  })
}

const render = (rootProps: Record<string, unknown>) => renderToString(createSSRApp(fixture(rootProps)))

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

  it('renders the label from a record and from groups', async () => {
    expect(await render({ defaultValue: 'b', items: { a: 'Apple', b: 'Banana' } })).toContain('value="Banana"')
    expect(await render({ defaultValue: 'b', items: [{ label: 'Fruits', items: fruits }] })).toContain('value="Banana"')
  })

  it('renders the labels of a multiple selection through `selectedLabels`', async () => {
    const html = await render({ defaultValue: ['b', 'a'], multiple: true, items: fruits })
    expect(html).toContain('<li>chip:Banana</li><li>chip:Apple</li>')
  })
})
