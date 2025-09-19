import type { VueWrapper } from '@vue/test-utils'
import { findAllByText, findByText, fireEvent } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { nextTick } from 'vue'
import AlertDialog from './story/_AlertDialog.vue'

describe('given a default Dialog', async () => {
  let wrapper: VueWrapper<InstanceType<typeof AlertDialog>>
  let trigger: HTMLElement

  beforeEach(async () => {
    wrapper = mount(AlertDialog, { attachTo: document.body })
    trigger = await findByText(wrapper.element as HTMLElement, 'Open')
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(document.body)).toHaveNoViolations()

    // open modal
    wrapper.find('button').element.click()
    await nextTick()
    expect(await axe(document.body)).toHaveNoViolations()
  })

  describe('after clicking the trigger', () => {
    beforeEach(async () => {
      fireEvent.click(trigger)
    })

    it('should open the content', () => {
      expect(document.body.innerHTML).toContain('Title')
    })

    it('should focus the cancel button', async () => {
      const cancelButton = await findAllByText(document.body, 'Cancel')
      expect(cancelButton[cancelButton.length - 1]).toBe(document.activeElement)
    })
  })
})
