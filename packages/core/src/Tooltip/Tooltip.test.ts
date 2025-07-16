import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import Tooltip from './stories/_Tooltip.vue'

describe('given default Tooltip', () => {
  let wrapper: VueWrapper<InstanceType<typeof Tooltip>>

  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(Tooltip, { attachTo: document.body })
  },
  )

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()

    await wrapper.find('button').trigger('focus')
    expect(await axe(document.body)).toHaveNoViolations()
  })

  it('should open when focus', async () => {
    await wrapper.find('button').trigger('focus')
    expect(document.body.innerHTML).toContain('Add to library')
  })

  describe('after focusing out', () => {
    beforeEach(() => {
      document.body.focus()
    })

    it('should close the tooltip', () => {
      expect(document.body.innerHTML).not.toContain('Add to library')
    })
  })

  describe('disabled tooltip', () => {
    it('should not be open when focus', async () => {
      await wrapper.setProps({ disabled: true })

      await wrapper.find('button').trigger('focus')

      expect(document.body.innerHTML).not.toContain('Add to library')
    })
  })
})
