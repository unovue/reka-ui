import type { VNodeChild } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, onMounted, ref, vShow, withDirectives } from 'vue'
import { DialogContent, DialogRoot, DialogTitle } from '@/Dialog'
import { DismissableLayer } from '@/DismissableLayer'
import { EditableArea, EditableInput, EditablePreview, EditableRoot } from '@/Editable'
import { FocusScope } from '@/FocusScope'
import { PopoverContent, PopoverRoot, PopoverTrigger } from '@/Popover'

function el(name: string) {
  return document.querySelector<HTMLElement>(`[data-t="${name}"]`)
}

function t(name: string, extra: object = {}) {
  return { 'data-t': name, ...extra }
}

function settle() {
  return new Promise(resolve => setTimeout(resolve, 50))
}

const outsideButton = () => h('button', t('outside'), 'Outside')

/** An input that moves focus outside and back to itself in its own `onMounted`. */
function bouncesOnMount(when: () => boolean = () => true) {
  return defineComponent(() => {
    const input = ref<HTMLElement>()
    onMounted(() => {
      if (!when())
        return
      el('outside')?.focus()
      input.value?.focus()
    })
    return () => h('input', t('a', { ref: input }))
  })
}

// Whether focus came back is read from the document two ticks after it left, so
// nothing depends on a listener having seen the event: not a consumer's
// `stopImmediatePropagation`, not when the listener attached, not Vue skipping it.
describe('focus leaving a layer', () => {
  const cleanups: (() => void)[] = []

  afterEach(() => {
    cleanups.splice(0).forEach(cleanup => cleanup())
    document.body.innerHTML = ''
  })

  function render(fn: () => VNodeChild, host: Element = document.body.appendChild(document.createElement('div'))) {
    const app = createApp(defineComponent(() => () => fn()))
    app.mount(host)
    let mounted = true
    const unmount = () => {
      if (mounted)
        app.unmount()
      mounted = false
    }
    cleanups.push(unmount)
    return unmount
  }

  function popover(onFocusOutside: () => void, contentProps: object = {}, kids: () => VNodeChild = () => h('input', t('a'))) {
    return () => h('div', [
      outsideButton(),
      h(PopoverRoot, { defaultOpen: true }, () => [
        h(PopoverTrigger, () => 'Open'),
        h(PopoverContent, { ...t('content'), onFocusOutside, ...contentProps }, kids),
      ]),
    ])
  }

  async function expectBounceKeepsItThenLeavingDismisses(onFocusOutside: ReturnType<typeof vi.fn>) {
    el('a')!.focus()
    await settle()
    el('outside')!.focus()
    el('a')!.focus()
    await settle()
    expect(onFocusOutside).not.toHaveBeenCalled()

    el('outside')!.focus()
    await settle()
    expect(onFocusOutside).toHaveBeenCalledTimes(1)
  }

  it('keeps a layer whose consumer stops the focus capture event', async () => {
    const onFocusOutside = vi.fn()
    render(popover(onFocusOutside, { onFocusCapture: (event: Event) => event.stopImmediatePropagation() }))
    await settle()
    await expectBounceKeepsItThenLeavingDismisses(onFocusOutside)
  })

  it('keeps a layer whose focus trap recalls focus past a consumer stopping the capture event', async () => {
    const onFocusOutside = vi.fn()
    render(() => h('div', [
      outsideButton(),
      h(DismissableLayer, { onFocusCapture: (event: Event) => event.stopImmediatePropagation(), onFocusOutside }, () =>
        h(FocusScope, { trapped: true }, () => h('input', t('a')))),
    ]))
    await settle()
    ;(document.activeElement as HTMLElement).blur()
    await settle()
    el('outside')!.focus()
    await settle()
    expect(document.activeElement).toBe(el('a'))
    expect(onFocusOutside).not.toHaveBeenCalled()
  })

  it('keeps a layer past a native capture listener a child added on mount', async () => {
    const onFocusOutside = vi.fn()
    const Kid = defineComponent(() => {
      onMounted(() => el('content')?.addEventListener('focus', event => event.stopImmediatePropagation(), { capture: true }))
      return () => h('input', t('a'))
    })
    render(popover(onFocusOutside, {}, () => h(Kid)))
    await settle()
    await expectBounceKeepsItThenLeavingDismisses(onFocusOutside)
  })

  it('keeps a layer when focus leaves and returns in a mounting child\'s `onMounted`', async () => {
    const onFocusOutside = vi.fn()
    const open = ref(false)
    const Kid = bouncesOnMount()
    render(() => h('div', [
      outsideButton(),
      h(PopoverRoot, { open: open.value }, () => [
        h(PopoverTrigger, () => 'Open'),
        h(PopoverContent, { ...t('content'), onFocusOutside }, () => h(Kid)),
      ]),
    ]))
    await settle()
    open.value = true
    await settle()
    expect(document.activeElement).toBe(el('a'))
    expect(onFocusOutside).not.toHaveBeenCalled()
  })

  it('keeps a bare DismissableLayer when focus leaves and returns in a mounting child\'s `onMounted`', async () => {
    const onFocusOutside = vi.fn()
    const show = ref(false)
    const Kid = bouncesOnMount()
    render(() => h('div', [
      outsideButton(),
      show.value ? h(DismissableLayer, { onFocusOutside }, () => h(Kid)) : null,
    ]))
    await settle()
    show.value = true
    await settle()
    expect(document.activeElement).toBe(el('a'))
    expect(onFocusOutside).not.toHaveBeenCalled()
  })

  it('keeps a re-keyed layer when focus leaves and returns in its child\'s `onMounted`', async () => {
    const onFocusOutside = vi.fn()
    const key = ref(1)
    const Kid = bouncesOnMount(() => key.value === 2)
    render(() => h('div', [
      outsideButton(),
      h(PopoverRoot, { defaultOpen: true }, () => [
        h(PopoverTrigger, () => 'Open'),
        h(PopoverContent, { ...t('content'), key: key.value, onFocusOutside }, () => h(Kid)),
      ]),
    ]))
    await settle()
    key.value = 2
    await settle()
    expect(document.activeElement).toBe(el('a'))
    expect(onFocusOutside).not.toHaveBeenCalled()
  })

  it('keeps a layer holding focus when an ancestor stops the event its capture listener would have seen', async () => {
    const onFocusOutside = vi.fn()
    const stop = (event: Event) => event.stopPropagation()
    render(popover(onFocusOutside))
    await settle()
    window.addEventListener('focus', stop, { capture: true })
    cleanups.push(() => window.removeEventListener('focus', stop, { capture: true }))
    el('outside')!.focus()
    el('a')!.focus()
    await settle()
    expect(onFocusOutside).not.toHaveBeenCalled()
    expect(el('content')).not.toBeNull()
  })

  describe('when the element changes', () => {
    it('follows `as` at runtime, and stops on teardown while open', async () => {
      const onFocusOutside = vi.fn()
      const as = ref('div')
      const unmount = render(() => popover(onFocusOutside, { as: as.value })())
      await settle()
      const first = el('content')
      as.value = 'section'
      await settle()
      expect(el('content')).not.toBe(first)
      expect(el('content')!.tagName).toBe('SECTION')
      el('a')!.focus()
      await settle()
      const outside = document.createElement('button')
      document.body.append(outside)
      unmount()
      await settle()
      outside.focus()
      await settle()
      expect(onFocusOutside).not.toHaveBeenCalled()
    })

    it('reads the new element after `as` changes', async () => {
      const onFocusOutside = vi.fn()
      const as = ref('div')
      render(() => popover(onFocusOutside, { as: as.value })())
      await settle()
      as.value = 'section'
      await settle()
      await expectBounceKeepsItThenLeavingDismisses(onFocusOutside)
    })

    it('reads the new element after an as-child element changes', async () => {
      const onFocusOutside = vi.fn()
      const tag = ref('div')
      render(() => popover(onFocusOutside, { asChild: true }, () => h(tag.value, t('content'), h('input', t('a'))))())
      await settle()
      const first = el('content')
      tag.value = 'section'
      await settle()
      expect(el('content')).not.toBe(first)
      await expectBounceKeepsItThenLeavingDismisses(onFocusOutside)
    })

    it('reads the new element after a re-key', async () => {
      const onFocusOutside = vi.fn()
      const key = ref(1)
      render(() => popover(onFocusOutside, { key: key.value })())
      await settle()
      const first = el('content')
      key.value = 2
      await settle()
      expect(el('content')).not.toBe(first)
      await expectBounceKeepsItThenLeavingDismisses(onFocusOutside)
    })

    it('is quiet while closed, and fires once after reopening', async () => {
      const onFocusOutside = vi.fn()
      const open = ref(true)
      render(() => h('div', [
        outsideButton(),
        h(PopoverRoot, { 'open': open.value, 'onUpdate:open': (value: boolean) => {
          open.value = value
        } }, () => [
          h(PopoverTrigger, () => 'Open'),
          h(PopoverContent, { ...t('content'), onFocusOutside }, () => h('input', t('a'))),
        ]),
      ]))
      await settle()
      open.value = false
      await settle()
      el('outside')!.focus()
      await settle()
      expect(onFocusOutside).not.toHaveBeenCalled()

      open.value = true
      await settle()
      await expectBounceKeepsItThenLeavingDismisses(onFocusOutside)
    })

    it('is quiet while a kept-mounted content is closed, and fires once after reopening', async () => {
      const onFocusOutside = vi.fn()
      const open = ref(true)
      render(() => h('div', [
        outsideButton(),
        h(DialogRoot, { 'open': open.value, 'modal': false, 'unmountOnHide': false, 'onUpdate:open': (value: boolean) => {
          open.value = value
        } }, () => h(DialogContent, { ...t('content'), onFocusOutside }, () => [h(DialogTitle, () => 'Title'), h('input', t('a'))])),
      ]))
      await settle()
      const element = el('content')
      open.value = false
      await settle()
      expect(el('content')).toBe(element)
      el('outside')!.focus()
      await settle()
      expect(onFocusOutside).not.toHaveBeenCalled()

      open.value = true
      await settle()
      expect(el('content')).toBe(element)
      await expectBounceKeepsItThenLeavingDismisses(onFocusOutside)
    })

    it('follows a content a consumer shows with `v-show` in the commit that opens it', async () => {
      const onFocusOutside = vi.fn()
      const onFocus = vi.fn()
      const open = ref(false)
      const visible = ref(false)
      render(() => h('div', [
        outsideButton(),
        h(PopoverRoot, { open: open.value }, () => [
          h(PopoverTrigger, () => 'Open'),
          withDirectives(
            h(PopoverContent, { ...t('content'), onFocusOutside }, () => h('input', t('a', { onFocus }))),
            [[vShow, visible.value]],
          ),
        ]),
      ]))
      await settle()
      open.value = true
      visible.value = true
      await settle()
      expect(document.activeElement).toBe(el('a'))
      expect(onFocus).toHaveBeenCalledTimes(1)
      await expectBounceKeepsItThenLeavingDismisses(onFocusOutside)
    })
  })

  describe('in shadow trees', () => {
    function shadow(mode: ShadowRootMode, light: string[] = []) {
      const host = document.body.appendChild(document.createElement('div'))
      for (const name of light)
        host.appendChild(document.createElement('input')).setAttribute('data-t', name)
      return { host, inner: host.attachShadow({ mode }).appendChild(document.createElement('div')) }
    }

    function hostInContent(mode: ShadowRootMode, refs: { a?: HTMLElement }) {
      return defineComponent(() => {
        const host = ref<HTMLElement>()
        onMounted(() => {
          refs.a = host.value!.attachShadow({ mode }).appendChild(document.createElement('input'))
        })
        return () => h('div', { ref: host })
      })
    }

    function inRoot(onFocusOutside: () => void, kids: () => VNodeChild, target: Element) {
      render(() => h(PopoverRoot, { defaultOpen: true }, () => [
        h(PopoverTrigger, () => 'Open'),
        h(PopoverContent, {
          onFocusOutside,
          onOpenAutoFocus: (event: Event) => event.preventDefault(),
          onCloseAutoFocus: (event: Event) => event.preventDefault(),
        }, kids),
      ]), target)
    }

    const rows: [string, (onFocusOutside: () => void) => () => HTMLElement][] = [
      ['a layer in an open root', (onFocusOutside) => {
        const input = ref<HTMLElement>()
        inRoot(onFocusOutside, () => h('input', { ref: input }), shadow('open').inner)
        return () => input.value!
      }],
      ['a layer in a closed root', (onFocusOutside) => {
        const input = ref<HTMLElement>()
        inRoot(onFocusOutside, () => h('input', { ref: input }), shadow('closed').inner)
        return () => input.value!
      }],
      ['an open root inside the layer', (onFocusOutside) => {
        const refs: { a?: HTMLElement } = {}
        const Host = hostInContent('open', refs)
        inRoot(onFocusOutside, () => h(Host), document.body.appendChild(document.createElement('div')))
        return () => refs.a!
      }],
      ['a closed root inside the layer', (onFocusOutside) => {
        const refs: { a?: HTMLElement } = {}
        const Host = hostInContent('closed', refs)
        inRoot(onFocusOutside, () => h(Host), document.body.appendChild(document.createElement('div')))
        return () => refs.a!
      }],
      ['content slotted into a layer in an open root', (onFocusOutside) => {
        const { inner } = shadow('open', ['a'])
        inRoot(onFocusOutside, () => h('slot'), inner)
        return () => el('a')!
      }],
      ['content slotted into a layer in a closed root', (onFocusOutside) => {
        const { inner } = shadow('closed', ['a'])
        inRoot(onFocusOutside, () => h('slot'), inner)
        return () => el('a')!
      }],
    ]

    it.each(rows)('reads focus through %s', async (_, make) => {
      const onFocusOutside = vi.fn()
      const outside = document.body.appendChild(document.createElement('button'))
      const input = make(onFocusOutside)
      await settle()

      input().focus()
      await settle()
      expect(onFocusOutside).not.toHaveBeenCalled()

      outside.focus()
      input().focus()
      await settle()
      expect(onFocusOutside).not.toHaveBeenCalled()

      outside.focus()
      await settle()
      expect(onFocusOutside).toHaveBeenCalledTimes(1)
    })

    it('keeps a layer when focus bounces into an iframe inside it', async () => {
      const onFocusOutside = vi.fn()
      const frame = ref<HTMLIFrameElement>()
      const input = ref<HTMLElement>()
      const outside = document.body.appendChild(document.createElement('button'))
      const loaded = new Promise((resolve) => {
        inRoot(onFocusOutside, () => [
          h('input', { ref: input }),
          h('iframe', { ref: frame, srcdoc: '<input>', onLoad: resolve }),
        ], document.body.appendChild(document.createElement('div')))
      })
      await loaded
      await settle()
      const innerInput = frame.value!.contentDocument!.querySelector('input')!

      input.value!.focus()
      await settle()
      outside.focus()
      innerInput.focus()
      await settle()
      expect(document.activeElement).toBe(frame.value)
      expect(onFocusOutside).not.toHaveBeenCalled()
    })

    it('reads focus inside an iframe\'s document', async () => {
      const onFocusOutside = vi.fn()
      const frame = document.body.appendChild(document.createElement('iframe'))
      const doc = frame.contentDocument!
      const outside = doc.body.appendChild(doc.createElement('button'))
      const input = ref<HTMLElement>()
      inRoot(onFocusOutside, () => h('input', { ref: input }), doc.body.appendChild(doc.createElement('div')))
      await settle()

      input.value!.focus()
      await settle()
      outside.focus()
      input.value!.focus()
      await settle()
      expect(onFocusOutside).not.toHaveBeenCalled()

      outside.focus()
      await settle()
      expect(onFocusOutside).toHaveBeenCalledTimes(1)
    })
  })

  describe('an Editable', () => {
    function editable(onSubmit: () => void) {
      return () => h('div', [
        outsideButton(),
        h(EditableRoot, { startWithEditMode: true, defaultValue: 'x', submitMode: 'blur', onSubmit }, () =>
          h(EditableArea, () => [h(EditablePreview), h(EditableInput, t('a'))])),
      ])
    }

    it('keeps editing when focus bounces, and submits when it stays outside', async () => {
      const onSubmit = vi.fn()
      render(editable(onSubmit))
      await settle()
      el('a')!.focus()
      await settle()

      el('outside')!.focus()
      el('a')!.focus()
      await settle()
      expect(onSubmit).not.toHaveBeenCalled()

      el('outside')!.focus()
      await nextTick()
      await settle()
      expect(onSubmit).toHaveBeenCalled()
    })
  })
})
