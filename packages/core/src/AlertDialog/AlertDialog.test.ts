import type { VueWrapper } from '@vue/test-utils'
import { findAllByText, findByText, fireEvent } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, nextTick } from 'vue'
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '.'
import AlertDialog from './story/_AlertDialog.vue'

const OPEN_TEXT = 'Open'
const CANCEL_TEXT = 'Cancel'

function makeAlertDialog(contentBinding: string) {
  return defineComponent({
    components: {
      AlertDialogAction,
      AlertDialogCancel,
      AlertDialogContent,
      AlertDialogOverlay,
      AlertDialogPortal,
      AlertDialogRoot,
      AlertDialogTitle,
      AlertDialogTrigger,
    },
    template: `<AlertDialogRoot>
  <AlertDialogTrigger>${OPEN_TEXT}</AlertDialogTrigger>
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogContent ${contentBinding}>
      <AlertDialogTitle>Title</AlertDialogTitle>
      <AlertDialogCancel>${CANCEL_TEXT}</AlertDialogCancel>
      <AlertDialogAction>Confirm</AlertDialogAction>
    </AlertDialogContent>
  </AlertDialogPortal>
</AlertDialogRoot>`,
  })
}

describe('given a modal AlertDialog (#2702)', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    document.body.style.pointerEvents = ''
  })

  it('should lock body pointer-events and keep content clickable by default', async () => {
    const wrapper = mount(makeAlertDialog(''), { attachTo: document.body })
    fireEvent.click(wrapper.find('button').element)

    const cancelButton = await findByText(document.body, CANCEL_TEXT)
    await nextTick()

    expect(document.body.style.pointerEvents).toBe('none')
    expect(cancelButton.closest('[data-dismissable-layer]')?.getAttribute('style')).toContain('pointer-events: auto')

    wrapper.unmount()
  })

  it('should respect disableOutsidePointerEvents=false on the content', async () => {
    const wrapper = mount(makeAlertDialog(':disable-outside-pointer-events="false"'), { attachTo: document.body })
    fireEvent.click(wrapper.find('button').element)

    const cancelButton = await findByText(document.body, CANCEL_TEXT)
    await nextTick()

    expect(document.body.style.pointerEvents).toBe('none')
    expect(cancelButton.closest('[data-dismissable-layer]')?.getAttribute('style') ?? '').not.toContain('pointer-events: auto')

    wrapper.unmount()
  })
})

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
      expect(cancelButton.at(-1)).toBe(document.activeElement)
    })
  })
})
