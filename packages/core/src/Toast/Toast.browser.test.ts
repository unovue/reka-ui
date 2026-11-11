import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, ref } from 'vue'
import { DialogContent, DialogPortal, DialogRoot, DialogTitle } from '@/Dialog'
import { ToastAction, ToastClose, ToastDescription, ToastProvider, ToastRoot, ToastTitle, ToastViewport } from '.'

function mountToast() {
  const open = ref(true)
  const Fixture = defineComponent({
    setup() {
      return () => h(ToastProvider, { duration: 60_000 }, () => [
        h(ToastRoot, {
          'open': open.value,
          'onUpdate:open': (value: boolean) => { open.value = value },
        }, () => [
          h(ToastTitle, { class: 'title' }, () => 'Saved'),
          h(ToastDescription, { class: 'description' }, () => 'Your changes are saved'),
          h(ToastAction, { altText: 'Undo the change' }, () => 'Undo'),
          h(ToastClose, { 'aria-label': 'Close' }, () => '×'),
        ]),
        h(ToastViewport, { 'data-testid': 'viewport' }),
      ])
    },
  })
  mount(Fixture, { attachTo: document.body })
  return { open }
}

describe('given a Toast, in a real browser', () => {
  it('keeps class on the title and description', async () => {
    mountToast()

    await expect.poll(() => document.querySelector('.title')?.textContent).toBe('Saved')
    expect(document.querySelector('.description')?.textContent).toBe('Your changes are saved')
  })

  it.each(['Undo', '×'])('moves focus to the viewport when "%s" is activated by keyboard', async (label) => {
    const { open } = mountToast()
    await expect.poll(() => document.querySelector('[data-testid="viewport"] button')).toBeTruthy()
    const viewport = document.querySelector<HTMLElement>('[data-testid="viewport"]')!
    const button = [...viewport.querySelectorAll('button')].find(el => el.textContent === label)!

    button.focus()
    await userEvent.keyboard('{Enter}')

    await expect.poll(() => open.value).toBe(false)
    expect(document.activeElement).toBe(viewport)
  })

  // A native radio group is one tab stop, so Tab leaves it for the next element.
  it.each([null, 'b'])('tabs out of a radio group in a toast (checked: %s)', async (checked) => {
    const Fixture = defineComponent({
      setup() {
        return () => h(ToastProvider, { duration: 60_000 }, () => [
          h(ToastRoot, { open: true }, () => [
            h(ToastTitle, () => 'Pick one'),
            ...['a', 'b', 'c'].map(value => h('input', {
              'type': 'radio',
              'name': 'size',
              value,
              'checked': value === checked,
              'aria-label': value,
              'data-testid': value,
            })),
            h(ToastAction, { 'altText': 'Apply', 'data-testid': 'apply' }, () => 'Apply'),
          ]),
          h(ToastViewport),
        ])
      },
    })
    mount(Fixture, { attachTo: document.body })
    await expect.poll(() => document.querySelector('[data-testid="a"]')).toBeTruthy()

    document.querySelector<HTMLElement>('[data-testid="a"]')!.focus()
    await userEvent.keyboard('{Tab}')
    expect(document.activeElement).toBe(document.querySelector('[data-testid="apply"]'))
  })
})

const DURATION = 300

function mountToasts({ inDialog = false } = {}) {
  const open = ref<Record<string, boolean>>({})
  const Fixture = defineComponent({
    setup() {
      const toasts = () => Object.keys(open.value).map(name => h(ToastRoot, {
        'key': name,
        'open': open.value[name],
        'onUpdate:open': (value: boolean) => { open.value[name] = value },
        'style': 'height: 40px',
      }, () => [
        h(ToastDescription, () => name),
        h(ToastAction, { 'altText': 'Undo', 'data-action': name }, () => 'Undo'),
        h(ToastClose, { 'data-close': name }, () => 'x'),
      ]))
      const content = () => [
        h('button', { 'data-testid': 'outside', 'style': 'margin-top: 300px' }, 'outside'),
        h(ToastViewport, { style: 'position: fixed; top: 0; right: 0; width: 300px; list-style: none; margin: 0' }),
      ]
      return () => h(ToastProvider, { duration: DURATION }, () => [
        ...toasts(),
        inDialog
          ? h(DialogRoot, { open: true }, () => h(DialogPortal, () => h(DialogContent, { 'aria-describedby': undefined }, () => [h(DialogTitle, () => 'Dialog'), ...content()])))
          : content(),
      ])
    },
  })
  mount(Fixture, { attachTo: document.body })
  return { open }
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
const el = (selector: string) => document.querySelector<HTMLElement>(selector)

describe('toast close pause, in a real browser', () => {
  it.each(['action', 'close'])('starts the next toast timer after the last toast is closed by its %s button (#3154)', async (kind) => {
    const { open } = mountToasts()
    open.value.a = true
    await expect.poll(() => el(`[data-${kind}="a"]`)).toBeTruthy()
    await userEvent.click(el(`[data-${kind}="a"]`)!)
    await expect.poll(() => el('li')).toBeNull()
    await userEvent.hover(el('[data-testid="outside"]')!)

    open.value.b = true
    await expect.poll(() => open.value.b, { timeout: DURATION * 6 }).toBe(false)
  })

  it('resumes the other toast once the pointer leaves after one of two is closed by its action (#3154 variant)', async () => {
    const { open } = mountToasts()
    open.value.a = true
    open.value.b = true
    await expect.poll(() => el('[data-action="a"]')).toBeTruthy()
    await userEvent.click(el('[data-action="a"]')!)
    await expect.poll(() => el('[data-action="a"]')).toBeNull()
    await userEvent.hover(el('[data-testid="outside"]')!)
    await sleep(50)
    await expect.poll(() => open.value.b, { timeout: DURATION * 6 }).toBe(false)
  })

  it('starts the next toast timer after toasts are closed inside a modal dialog (#1795)', async () => {
    const { open } = mountToasts({ inDialog: true })
    open.value.a = true
    open.value.b = true
    await expect.poll(() => el('[data-close="b"]')).toBeTruthy()
    await userEvent.click(el('[data-close="b"]')!)
    await expect.poll(() => el('[data-close="b"]')).toBeNull()
    await userEvent.click(el('[data-close="a"]')!)
    await expect.poll(() => el('li')).toBeNull()
    await userEvent.hover(el('[data-testid="outside"]')!)

    open.value.c = true
    await expect.poll(() => open.value.c, { timeout: DURATION * 6 }).toBe(false)
  })
})
