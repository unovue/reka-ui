import { afterEach, describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, ref } from 'vue'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuRoot, DropdownMenuTrigger } from '@/DropdownMenu'

// A consumer's `@mount-auto-focus` and `@unmount-auto-focus` run after the menu's
// own handlers. So a consumer can see `defaultPrevented` from them, and focus it
// moves in `@mount-auto-focus` stays where it put it.

const wait = (ms = 60) => new Promise(resolve => setTimeout(resolve, ms))
const active = () => (document.activeElement as HTMLElement | null)?.dataset?.t ?? document.activeElement?.tagName.toLowerCase()

let cleanup: (() => void) | undefined
afterEach(() => {
  cleanup?.()
  cleanup = undefined
})

function render(renderFn: () => ReturnType<typeof h>) {
  const host = document.createElement('div')
  document.body.append(host)
  const app = createApp(defineComponent({ setup: () => renderFn }))
  app.mount(host)
  cleanup = () => {
    app.unmount()
    host.remove()
  }
}

describe('menu content: consumer auto-focus listeners', () => {
  it('run after the internal handlers, and keep the focus they move', async () => {
    const log: string[] = []
    render(() => h('div', [
      h('input', { 'data-t': 'pre' }),
      h(DropdownMenuRoot, { defaultOpen: true, modal: false }, () => [
        h(DropdownMenuTrigger, () => 'o'),
        h(DropdownMenuContent, {
          'data-t': 'c',
          'onOpenAutoFocus': (event: Event) => log.push(`open prevented:${event.defaultPrevented} active:${active()}`),
          'onMountAutoFocus': (event: Event) => {
            log.push(`mount prevented:${event.defaultPrevented} active:${active()}`)
            ;(document.querySelector('[data-t=pre]') as HTMLElement).focus()
          },
          'onCloseAutoFocus': (event: Event) => log.push(`close prevented:${event.defaultPrevented}`),
          'onUnmountAutoFocus': (event: Event) => log.push(`unmount prevented:${event.defaultPrevented}`),
        }, () => h(DropdownMenuItem, () => 'A')),
      ]),
    ]))
    await wait()
    log.push(`afterOpen:${active()}`)
    expect(log).toEqual([
      'open prevented:false active:body',
      'mount prevented:true active:c',
      'close prevented:false',
      'unmount prevented:true',
      'afterOpen:pre',
    ])
  })

  it('`@unmount-auto-focus` sees a `@close-auto-focus` preventDefault', async () => {
    const log: string[] = []
    const show = ref(true)
    render(() => h('div', [show.value
      ? h(DropdownMenuRoot, { defaultOpen: true, modal: false }, () => [
          h(DropdownMenuTrigger, () => 'o'),
          h(DropdownMenuContent, {
            onCloseAutoFocus: (event: Event) => {
              event.preventDefault()
              log.push('close')
            },
            onUnmountAutoFocus: (event: Event) => log.push(`unmount prevented:${event.defaultPrevented}`),
          }, () => h(DropdownMenuItem, () => 'A')),
        ])
      : null]))
    await wait()
    show.value = false
    await wait()
    expect(log).toEqual(['close', 'unmount prevented:true'])
  })
})
