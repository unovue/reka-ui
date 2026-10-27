import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h } from 'vue'
import { EditableArea, EditableInput, EditablePreview, EditableRoot } from '.'

describe('given an Editable with submitMode "blur", in a real browser', () => {
  it('a cancelled outside click runs beforeUpdate:modelValue once and keeps edit mode', async () => {
    const onBeforeUpdate = vi.fn((_value: string, details: { cancel: () => void }) => details.cancel())
    const wrapper = mount(defineComponent({
      setup: () => () => [
        h(EditableRoot, { 'submitMode': 'blur', 'startWithEditMode': true, 'onBeforeUpdate:modelValue': onBeforeUpdate }, () =>
          h(EditableArea, () => [h(EditablePreview), h(EditableInput)])),
        h('button', { type: 'button' }, 'Outside'),
      ],
    }), { attachTo: document.body })
    const input = wrapper.get('input').element as HTMLInputElement
    const outside = wrapper.get('button').element

    await userEvent.type(input, 'b')
    await userEvent.click(outside)

    // Both the press and the focus move have been dispatched by now.
    await expect.poll(() => document.activeElement).toBe(outside)
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(onBeforeUpdate).toHaveBeenCalledTimes(1)
    expect(input.hidden).toBe(false)
    wrapper.unmount()
  })
})
