import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { h, nextTick } from 'vue'
import { CheckboxIndicator, CheckboxRoot } from '@/Checkbox'
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from '@/Slider'
import { SwitchRoot, SwitchThumb } from '@/Switch'

function mountForm() {
  const wrapper = mount({
    render: () => h('form', { 'data-testid': 'form' }, [
      h(CheckboxRoot, { name: 'agree', defaultValue: true }, () => h(CheckboxIndicator)),
      h(SwitchRoot, { name: 'news', defaultValue: true }, () => h(SwitchThumb)),
      h(SliderRoot, { name: 'volume', defaultValue: [50] }, () => [
        h(SliderTrack, () => h(SliderRange)),
        h(SliderThumb),
      ]),
    ]),
  }, { attachTo: document.body })
  const form = wrapper.get('form').element as HTMLFormElement
  return { wrapper, form, data: () => Object.fromEntries(new FormData(form).entries()) }
}

describe('hidden inputs of a form with a native reset', () => {
  let mounted: ReturnType<typeof mountForm> | undefined
  afterEach(() => {
    mounted?.wrapper.unmount()
    mounted = undefined
  })

  it('submits the mounted state', async () => {
    mounted = mountForm()
    await nextTick()
    await nextTick()
    expect(mounted.data()).toEqual({ 'agree': 'on', 'news': 'on', 'volume[0]': '50' })
  })

  it('still submits the visible state after a native reset', async () => {
    mounted = mountForm()
    await nextTick()
    await nextTick()
    const before = mounted.data()

    mounted.form.reset()
    await new Promise(r => setTimeout(r, 50))
    await nextTick()

    expect(document.querySelector('[role="checkbox"]')!.getAttribute('aria-checked')).toBe('true')
    expect(document.querySelector('[role="switch"]')!.getAttribute('aria-checked')).toBe('true')
    expect(document.querySelector('[role="slider"]')!.getAttribute('aria-valuenow')).toBe('50')
    expect(mounted.data()).toEqual(before)
  })
})
