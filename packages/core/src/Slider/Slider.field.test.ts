import type { VueWrapper } from '@vue/test-utils'
import { renderToString } from '@vue/server-renderer'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import { FieldLabel, FieldRoot } from '@/Field'
import { FormRoot } from '@/Form'
import { describeFieldControlContract } from '@/test/fieldControlContract'
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from '.'

globalThis.ResizeObserver ??= class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function renderSlider(props: Record<string, unknown>, thumbs = 1) {
  return h(SliderRoot, props, () => [
    h(SliderTrack, () => h(SliderRange)),
    ...Array.from({ length: thumbs }, () => h(SliderThumb)),
  ])
}

const thumbs = (wrapper: VueWrapper) => wrapper.findAll('[role="slider"]')

async function step(wrapper: VueWrapper, index = 0) {
  const thumb = thumbs(wrapper)[index]
  ;(thumb.element as HTMLElement).focus()
  await thumb.trigger('keydown', { key: 'ArrowRight' })
  await flushPromises()
}

describeFieldControlContract({
  name: 'Slider',
  render: props => renderSlider(props),
  control: wrapper => thumbs(wrapper)[0].element as HTMLElement,
  interact: wrapper => step(wrapper),
  // Reka's model: an array, even for a single thumb.
  interactedValue: [1],
  emptyValue: [0],
  filledValue: [50],
  // A slider always has a value.
  noRequired: true,
})

describe('given a Field-wrapped range Slider', () => {
  function mountInField(onFormSubmit = vi.fn()) {
    const model = ref([20, 80])
    const Harness = defineComponent({
      setup: () => () => h(FormRoot, { onFormSubmit }, () => [
        h(FieldRoot, { 'name': 'range', 'data-testid': 'field' }, () => [
          h(FieldLabel, () => 'Price'),
          renderSlider({ 'modelValue': model.value, 'onUpdate:modelValue': (value: number[]) => { model.value = value } }, 2),
        ]),
        h('button', { type: 'submit' }, 'Submit'),
      ]),
    })
    const wrapper = mount(Harness, { attachTo: document.body })
    return { wrapper, model, field: () => wrapper.find('[data-testid="field"]') }
  }

  it('labels every thumb with the field label and its own name, and submits every value', async () => {
    const onFormSubmit = vi.fn()
    const { wrapper, field } = mountInField(onFormSubmit)
    await flushPromises()
    const labelId = wrapper.find('label').attributes('id')
    const [min, max] = thumbs(wrapper).map(thumb => thumb.element as HTMLElement)
    expect(wrapper.find('label').attributes('for')).toBe(min.id)
    expect(max.id).toBeTruthy()
    expect(max.id).not.toBe(min.id)
    expect(min.getAttribute('aria-labelledby')).toBe(`${labelId} ${min.id}`)
    expect(max.getAttribute('aria-labelledby')).toBe(`${labelId} ${max.id}`)
    expect(min.getAttribute('aria-label')).toBe('Minimum')

    await step(wrapper, 1)
    expect(field().attributes('data-dirty')).toBe('')
    await wrapper.find('button[type="submit"]').trigger('submit')
    expect(onFormSubmit.mock.calls[0][0]).toEqual({ range: [20, 81] })
    wrapper.unmount()
  })

  it('stays focused moving between thumbs, and is touched once focus leaves the slider', async () => {
    const { wrapper, field } = mountInField()
    await flushPromises()
    const [min, max] = thumbs(wrapper).map(thumb => thumb.element as HTMLElement)
    min.focus()
    await nextTick()
    max.focus()
    await nextTick()
    expect(field().attributes('data-focused')).toBe('')
    expect(field().attributes('data-touched')).toBeUndefined()

    max.blur()
    await nextTick()
    expect(field().attributes('data-touched')).toBe('')
    expect(field().attributes('data-focused')).toBeUndefined()
    wrapper.unmount()
  })
})

describe('given an invalid Field-wrapped Slider', () => {
  it('blocks submission, marks every thumb invalid and focuses the first', async () => {
    const onFormSubmit = vi.fn()
    const Harness = defineComponent({
      setup: () => () => h(FormRoot, { onFormSubmit }, () => [
        h(FieldRoot, { name: 'range', validate: () => 'Too narrow' }, () => [
          h(FieldLabel, () => 'Price'),
          renderSlider({ defaultValue: [20, 80] }, 2),
        ]),
        h('button', { type: 'submit' }, 'Submit'),
      ]),
    })
    const wrapper = mount(Harness, { attachTo: document.body })
    await flushPromises()
    await wrapper.find('button[type="submit"]').trigger('submit')
    await nextTick()
    expect(onFormSubmit).not.toHaveBeenCalled()
    const [min, max] = thumbs(wrapper).map(thumb => thumb.element as HTMLElement)
    expect(min.getAttribute('aria-invalid')).toBe('true')
    expect(max.getAttribute('aria-invalid')).toBe('true')
    expect(document.activeElement).toBe(min)
    wrapper.unmount()
  })
})

describe('given a server-rendered Field-wrapped range Slider', () => {
  it('renders no duplicate thumb ids', async () => {
    const html = await renderToString(createSSRApp(defineComponent({
      setup: () => () => h(FieldRoot, { name: 'range' }, () => [
        h(FieldLabel, () => 'Price'),
        renderSlider({ defaultValue: [20, 80] }, 2),
      ]),
    })))
    const ids = Array.from(html.matchAll(/ id="([^"]+)"/g), match => match[1])
    expect(new Set(ids).size).toBe(ids.length)
  })
})
