import type { VueWrapper } from '@vue/test-utils'
import { findAllByText, findByRole, findByText, fireEvent } from '@testing-library/vue'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick, ref } from 'vue'
import { AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogRoot, AlertDialogTitle, AlertDialogTrigger } from '.'
import AlertDialog from './story/_AlertDialog.vue'

describe('given a default Dialog', async () => {
  let wrapper: VueWrapper<InstanceType<typeof AlertDialog>>
  let trigger: HTMLElement

  beforeEach(async () => {
    wrapper = mount(AlertDialog, { attachTo: document.body })
    trigger = await findByText(wrapper.element as HTMLElement, 'Open')
  })

  afterEach(() => {
    wrapper.unmount()
    document.body.innerHTML = ''
    document.body.style.cssText = ''
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
      expect(cancelButton.at(-1)).toBe(document.activeElement)
    })

    it('should keep content interactive while body pointer events are locked', async () => {
      const content = await findByRole(document.body, 'alertdialog')

      expect(document.body.style.pointerEvents).toBe('none')
      expect(content.style.pointerEvents).toBe('auto')
    })
  })
})

describe('given an AlertDialog root that stays mounted', () => {
  it('should release the cancel element when the content closes', async () => {
    const open = ref(false)
    const wrapper = mount(defineComponent({
      setup: () => () => h(AlertDialogRoot, { open: open.value }, () => [
        h(AlertDialogTrigger, () => 'Open'),
        h(AlertDialogContent, () => [
          h(AlertDialogTitle, () => 'Title'),
          h(AlertDialogDescription, () => 'Description'),
          h(AlertDialogCancel, () => 'Cancel'),
        ]),
      ]),
    }), { attachTo: document.body })
    // `AlertDialogContent` stays mounted while closed and holds the cancel element.
    const content = wrapper.getComponent(AlertDialogContent)
    const cancelElement = () => (content.vm.$ as any).setupState.cancelElement as HTMLElement | undefined

    for (let cycle = 0; cycle < 2; cycle++) {
      open.value = true
      await flushPromises()
      const cancel = wrapper.get('button:not([aria-haspopup])').element
      expect(cancelElement()).toBe(cancel)
      // Opening still moves focus to the cancel button.
      expect(document.activeElement).toBe(cancel)

      open.value = false
      await flushPromises()
      expect(wrapper.find('[role="alertdialog"]').exists()).toBe(false)
      expect(cancelElement()).toBeUndefined()
    }

    wrapper.unmount()
  })
})
