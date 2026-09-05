import type { VueWrapper } from '@vue/test-utils'
import { findAllByText, findByRole, findByText, fireEvent } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { nextTick } from 'vue'
import { AlertDialogRoot } from '.'
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

// #2828 — `AlertDialogRoot` re-declares `DialogRootEmits`, so the forwarded
// `beforeUpdate:open` / `update:open` carry the same `(value, details)` and
// `AlertDialogCancel` / `AlertDialogAction` (both `DialogClose`) report 'close-press'.
describe('alertDialogRoot change events (v3 foundation contract)', () => {
  let wrapper: VueWrapper<InstanceType<typeof AlertDialog>>

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(AlertDialog, { attachTo: document.body })
  })

  afterEach(() => {
    wrapper.unmount()
    document.body.innerHTML = ''
    document.body.style.cssText = ''
  })

  it('forwards update:open with (value, details) and reason "trigger-press" on open', async () => {
    await fireEvent.click(await findByText(wrapper.element as HTMLElement, 'Open'))

    const root = wrapper.findComponent(AlertDialogRoot)
    const keys = Object.keys(root.emitted()).filter(k => k.endsWith(':open'))
    expect(keys).toEqual(['beforeUpdate:open', 'update:open'])
    const [value, details] = root.emitted('update:open')![0]
    expect(value).toBe(true)
    expect(details).toMatchObject({ reason: 'trigger-press', isCanceled: false })
    expect(details.event).toBeInstanceOf(MouseEvent)
    // the story binds `v-model:open`, so the round-trip lands on the parent
    expect((wrapper.vm as any).isOpen).toBe(true)
  })

  it('reports reason "close-press" when AlertDialogCancel is clicked', async () => {
    await fireEvent.click(await findByText(wrapper.element as HTMLElement, 'Open'))
    const cancelButton = (await findAllByText(document.body, 'Cancel')).at(-1)!

    await fireEvent.click(cancelButton)
    await nextTick()

    const [value, details] = wrapper.findComponent(AlertDialogRoot).emitted('update:open')!.at(-1)!
    expect(value).toBe(false)
    expect(details).toMatchObject({ reason: 'close-press' })
    expect(details.event).toBeInstanceOf(MouseEvent)
    expect((wrapper.vm as any).isOpen).toBe(false)
  })

  it('reports reason "close-press" when AlertDialogAction is clicked', async () => {
    await fireEvent.click(await findByText(wrapper.element as HTMLElement, 'Open'))
    const actionButton = (await findAllByText(document.body, 'Yes, delete account')).at(-1)!

    await fireEvent.click(actionButton)
    await nextTick()

    const [value, details] = wrapper.findComponent(AlertDialogRoot).emitted('update:open')!.at(-1)!
    expect(value).toBe(false)
    expect(details).toMatchObject({ reason: 'close-press' })
    expect((wrapper.vm as any).isOpen).toBe(false)
  })

  it('details.cancel() in beforeUpdate:open keeps the alert dialog open', async () => {
    wrapper.unmount()
    const onBefore = vi.fn((_value: boolean, details: { cancel: () => void }) => details.cancel())
    wrapper = mount(AlertDialog, {
      attachTo: document.body,
      // The story's single root is `AlertDialogRoot`, so the listener falls through to it as an attr.
      attrs: { 'onBeforeUpdate:open': onBefore },
    })
    await fireEvent.click(await findByText(wrapper.element as HTMLElement, 'Open'))
    await nextTick()

    expect(onBefore).toHaveBeenCalledTimes(1)
    expect(wrapper.findComponent(AlertDialogRoot).emitted('update:open')).toBeUndefined()
    expect((wrapper.vm as any).isOpen).toBe(false)
    expect(document.body.innerHTML).not.toContain('Title')
  })
})
