import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { nextTick } from 'vue'
import Popover from './story/_Popover.vue'

describe('given default Popover', () => {
  let wrapper: VueWrapper<InstanceType<typeof Popover>>

  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  beforeEach(() => {
    wrapper = mount(Popover, { attachTo: document.body })
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  describe('after opening popover', async () => {
    beforeEach(async () => {
      wrapper.find('button').element.click()
      await nextTick()
    })

    it('should pass axe accessibility tests', async () => {
      expect(await axe(document.body, {
        rules: {
          // we dont check for dialog-name when using Popover
          'aria-dialog-name': {
            enabled: false,
          },
        },
      })).toHaveNoViolations()
    })
  })
})
