import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { markRaw, nextTick, ref } from 'vue'
import { Slot } from './Slot'
import { useRender } from './useRender'

// Minimal harness: expose the composable return so we can assert computeds directly.
function setup(options: Parameters<typeof useRender>[0]) {
  let api!: ReturnType<typeof useRender>
  mount({
    setup() {
      api = useRender(options)
      return () => null
    },
  })
  return api
}

describe('useRender — tag resolution', () => {
  it('resolves to div when no as/defaultTagName given', () => {
    expect(setup({}).tag.value).toBe('div')
  })
  it('resolves to defaultTagName when as is undefined', () => {
    expect(setup({ defaultTagName: 'label' }).tag.value).toBe('label')
  })
  it('resolves a string as', () => {
    expect(setup({ as: 'span' }).tag.value).toBe('span')
  })
  it('returns Slot and renderless=true when asChild is true', () => {
    const api = setup({ asChild: true })
    expect(api.tag.value).toBe(Slot)
    expect(api.renderless.value).toBe(true)
  })
  it('returns Slot when as === Slot', () => {
    expect(setup({ as: markRaw(Slot) }).tag.value).toBe(Slot)
  })
  it('treats as="template" as renderless (v2 compat)', () => {
    expect(setup({ as: 'template' }).renderless.value).toBe(true)
  })
  it('marks self-closing tags', () => {
    expect(setup({ as: 'input' }).selfClosing.value).toBe(true)
    expect(setup({ as: 'div' }).selfClosing.value).toBe(false)
  })
  it('updates tag reactively when as changes', async () => {
    const as = ref<'div' | 'span'>('div')
    const api = setup({ as })
    expect(api.tag.value).toBe('div')
    as.value = 'span'
    await nextTick()
    expect(api.tag.value).toBe('span')
  })
})

describe('useRender — renderProps', () => {
  it('passes through options.props', () => {
    expect(setup({ props: { id: 'x' } }).renderProps.value).toMatchObject({ id: 'x' })
  })
  it('boolean true state → empty-string data attribute', () => {
    expect(setup({ state: { disabled: true } }).renderProps.value).toMatchObject({ 'data-disabled': '' })
  })
  it('omits data attribute for false/undefined state', () => {
    const rp = setup({ state: { disabled: false, open: undefined } }).renderProps.value
    expect(rp).not.toHaveProperty('data-disabled')
    expect(rp).not.toHaveProperty('data-open')
  })
  it('string/number state → value data attribute (kebab-cased key)', () => {
    expect(setup({ state: { orientation: 'horizontal' } }).renderProps.value)
      .toMatchObject({ 'data-orientation': 'horizontal' })
  })
  it('applies stateAttributesMapping overrides', () => {
    const rp = setup({
      state: { checked: true },
      stateAttributesMapping: { checked: v => ({ 'aria-checked': String(v) }) },
    }).renderProps.value
    expect(rp).toMatchObject({ 'aria-checked': 'true' })
  })
})
