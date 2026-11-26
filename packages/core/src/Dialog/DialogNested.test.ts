import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { AlertDialogContent, AlertDialogRoot, AlertDialogTitle } from '@/AlertDialog'
import { DialogContent, DialogRoot, DialogTitle } from '.'

const get = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)
const nestedCount = (id: string) => get(id)!.style.getPropertyValue('--nested-dialogs')
const isNestedOpen = (id: string) => get(id)!.hasAttribute('data-nested-dialog-open')

describe('given nested Dialogs', () => {
  let cleanup: (() => void) | undefined

  afterEach(() => {
    cleanup?.()
    cleanup = undefined
  })

  function setup(options: { alert?: boolean } = {}) {
    const open = ref({ first: false, second: false, sibling: false })
    const hasSecond = ref(true)
    const Root = options.alert ? AlertDialogRoot : DialogRoot
    const Content = options.alert ? AlertDialogContent : DialogContent
    const Title = options.alert ? AlertDialogTitle : DialogTitle
    const dialog = (id: string, isOpen: boolean | undefined, children: () => any[] = () => []) =>
      h(Root, isOpen === undefined ? { defaultOpen: true } : { open: isOpen }, () => [
        h(Content, { 'data-testid': id, 'aria-describedby': undefined }, () => [
          h(Title, null, () => id),
          ...children(),
        ]),
      ])
    const wrapper = mount(defineComponent({
      setup() {
        return () => dialog('root', undefined, () => [
          dialog('first', open.value.first, () => [
            hasSecond.value ? dialog('second', open.value.second) : null,
          ]),
          dialog('sibling', open.value.sibling),
        ])
      },
    }), { attachTo: document.body })
    cleanup = () => wrapper.unmount()
    return { open, hasSecond }
  }

  it('keeps counting a dialog that stays open in the root slot of a closed dialog', async () => {
    const middleOpen = ref(true)
    const wrapper = mount(defineComponent({
      setup() {
        return () => h(DialogRoot, { defaultOpen: true }, () => [
          h(DialogContent, { 'data-testid': 'outer', 'aria-describedby': undefined }, () => [
            h(DialogTitle, null, () => 'outer'),
            h(DialogRoot, { open: middleOpen.value }, () => [
              h(DialogContent, { 'data-testid': 'middle', 'aria-describedby': undefined }, () => [
                h(DialogTitle, null, () => 'middle'),
              ]),
              // Not inside the middle dialog's content, so it stays mounted and open when the middle one closes
              h(DialogRoot, { defaultOpen: true }, () => [
                h(DialogContent, { 'data-testid': 'inner', 'aria-describedby': undefined }, () => [
                  h(DialogTitle, null, () => 'inner'),
                ]),
              ]),
            ]),
          ]),
        ])
      },
    }), { attachTo: document.body })
    cleanup = () => wrapper.unmount()
    await nextTick()
    await nextTick()
    expect(nestedCount('outer')).toBe('2')

    middleOpen.value = false
    await nextTick()
    await nextTick()
    expect(get('inner')).not.toBeNull()
    expect(nestedCount('outer')).toBe('1')
    expect(isNestedOpen('outer')).toBe(true)
  })

  it('has no hook and a count of 0 while no nested dialog is open', async () => {
    setup()
    await nextTick()

    expect(isNestedOpen('root')).toBe(false)
    expect(nestedCount('root')).toBe('0')
  })

  it.each([false, true])('marks each dialog below an open nested dialog and counts the dialogs on top of it (alert dialog: %s)', async (alert) => {
    const { open } = setup({ alert })
    await nextTick()

    open.value.first = true
    await nextTick()
    await nextTick()
    expect(isNestedOpen('root')).toBe(true)
    expect(nestedCount('root')).toBe('1')
    expect(isNestedOpen('first')).toBe(false)
    expect(nestedCount('first')).toBe('0')

    open.value.second = true
    await nextTick()
    await nextTick()
    expect(nestedCount('root')).toBe('2')
    expect(isNestedOpen('first')).toBe(true)
    expect(nestedCount('first')).toBe('1')
    expect(isNestedOpen('second')).toBe(false)
  })

  it('drops the hook as soon as the nested dialog closes', async () => {
    const { open } = setup()
    await nextTick()
    open.value.first = true
    open.value.second = true
    await nextTick()
    await nextTick()
    expect(nestedCount('root')).toBe('2')

    open.value.second = false
    await nextTick()
    await nextTick()
    expect(nestedCount('root')).toBe('1')
    expect(isNestedOpen('first')).toBe(false)

    open.value.first = false
    await nextTick()
    await nextTick()
    expect(isNestedOpen('root')).toBe(false)
    expect(nestedCount('root')).toBe('0')
  })

  it('adds up nested dialogs that are open side by side', async () => {
    const { open } = setup()
    await nextTick()

    open.value.first = true
    open.value.sibling = true
    await nextTick()
    await nextTick()
    expect(nestedCount('root')).toBe('2')

    open.value.sibling = false
    await nextTick()
    await nextTick()
    expect(nestedCount('root')).toBe('1')
  })

  it('stops counting a nested dialog that is removed while open', async () => {
    const { open, hasSecond } = setup()
    await nextTick()
    open.value.first = true
    open.value.second = true
    await nextTick()
    await nextTick()
    expect(nestedCount('first')).toBe('1')

    hasSecond.value = false
    await nextTick()
    await nextTick()
    expect(isNestedOpen('first')).toBe(false)
    expect(nestedCount('root')).toBe('1')
  })

  it('keeps a style passed to the content', async () => {
    mount(defineComponent({
      setup() {
        return () => h(DialogRoot, { defaultOpen: true }, () => [
          h(DialogContent, { 'data-testid': 'styled', 'style': 'color: red;', 'aria-describedby': undefined }, () => [
            h(DialogTitle, null, () => 'Styled'),
          ]),
        ])
      },
    }), { attachTo: document.body })
    await nextTick()

    expect(get('styled')!.style.color).toBe('red')
    expect(nestedCount('styled')).toBe('0')
  })
})
