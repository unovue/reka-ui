import type { Component, VNodeChild } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, onMounted, ref, shallowRef } from 'vue'
import { FieldRoot, injectFieldRootContext } from '@/Field'
import { DateFieldInput, DateFieldRoot } from '.'

function el(name: string) {
  return document.querySelector<HTMLElement>(`[data-t="${name}"]`)
}

function month() {
  return document.querySelector<HTMLElement>('[data-segment=month]')!
}

function settle() {
  return new Promise(resolve => setTimeout(resolve, 50))
}

interface SlotProps {
  segments: { part: 'month', value: string }[]
}

function renderSegments({ segments }: SlotProps) {
  return segments.map(segment => h(DateFieldInput, { 'part': segment.part, 'key': segment.part, 'data-segment': segment.part }, () => segment.value))
}

const segments = { default: renderSegments }

/** Whether removing a focused element fires `focusout` in this browser. Firefox and WebKit don't. */
function removalFiresFocusout() {
  const input = document.body.appendChild(document.createElement('input'))
  let fired = false
  input.addEventListener('focusout', () => {
    fired = true
  })
  input.focus()
  input.remove()
  return fired
}

describe('a DateField\'s focus state', () => {
  let app: ReturnType<typeof createApp> | undefined

  afterEach(() => {
    app?.unmount()
    app = undefined
    document.body.innerHTML = ''
  })

  function render(fn: () => VNodeChild) {
    app = createApp(defineComponent(() => () => fn()))
    app.mount(document.body.appendChild(document.createElement('div')))
  }

  function focused() {
    return el('field')!.hasAttribute('data-focused')
  }

  function touched() {
    return el('field')!.hasAttribute('data-touched')
  }

  const outside = () => h('button', { 'data-t': 'outside' }, 'Outside')

  function inField(fn: () => VNodeChild) {
    return () => h('div', [outside(), h(FieldRoot, { 'data-t': 'field' }, fn)])
  }

  /** A listener on the root element from a sibling's `onMounted`: a consumer's earliest. */
  function onMountedListener(listener: (event: Event) => void) {
    return defineComponent(() => {
      onMounted(() => el('root')!.addEventListener('focusin', listener))
      return () => null
    })
  }

  it('clears when a listener a consumer added on mount moves focus out', async () => {
    const Kid = onMountedListener(() => el('outside')!.focus())
    render(inField(() => [h(DateFieldRoot as Component, { 'data-t': 'root' }, segments), h(Kid)]))
    await settle()
    month().focus()
    await settle()
    expect(document.activeElement).toBe(el('outside'))
    expect(focused()).toBe(false)
  })

  it('clears when a listener a consumer added on mount blurs the segment', async () => {
    const Kid = onMountedListener(event => (event.target as HTMLElement).blur())
    render(inField(() => [h(DateFieldRoot as Component, { 'data-t': 'root' }, segments), h(Kid)]))
    await settle()
    month().focus()
    await settle()
    expect(focused()).toBe(false)
  })

  it('reports a focus in a sibling\'s `onMounted`', async () => {
    const Kid = defineComponent(() => {
      onMounted(() => month().focus())
      return () => null
    })
    const show = ref(false)
    render(inField(() => show.value
      ? [h(DateFieldRoot as Component, { 'data-t': 'root' }, segments), h(Kid)]
      : []))
    await settle()
    show.value = true
    await settle()
    expect(document.activeElement).toBe(month())
    expect(focused()).toBe(true)
  })

  // The removal's `focusout` reaches the listener on the element going away, so that
  // listener has to outlast the element.
  describe('when the element goes away with focus inside', () => {
    function expectBlurredIfTheBrowserSaysSo(fires: boolean) {
      expect(focused()).toBe(!fires)
      expect(touched()).toBe(fires)
    }

    it('leaves the Field on `v-if`', async () => {
      const fires = removalFiresFocusout()
      const show = ref(true)
      render(inField(() => show.value ? h(DateFieldRoot as Component, { 'data-t': 'root' }, segments) : null))
      await settle()
      month().focus()
      await settle()
      expect(focused()).toBe(true)

      show.value = false
      await settle()
      expectBlurredIfTheBrowserSaysSo(fires)
    })

    it('leaves the Field on a re-key, and reports the new element', async () => {
      const fires = removalFiresFocusout()
      const key = ref(1)
      render(inField(() => h(DateFieldRoot as Component, { 'data-t': 'root', 'key': key.value }, segments)))
      await settle()
      month().focus()
      await settle()

      key.value = 2
      await settle()
      expectBlurredIfTheBrowserSaysSo(fires)

      month().focus()
      await settle()
      expect(focused()).toBe(true)
      el('outside')!.focus()
      await settle()
      expect(focused()).toBe(false)
      expect(touched()).toBe(true)
    })

    it('leaves the Field when `as` changes, and reports the new element', async () => {
      const fires = removalFiresFocusout()
      const as = ref('div')
      render(inField(() => h(DateFieldRoot as Component, { 'data-t': 'root', 'as': as.value }, segments)))
      await settle()
      const first = el('root')
      month().focus()
      await settle()

      as.value = 'section'
      await settle()
      expect(el('root')).not.toBe(first)
      expectBlurredIfTheBrowserSaysSo(fires)

      month().focus()
      await settle()
      expect(focused()).toBe(true)
      el('outside')!.focus()
      await settle()
      expect(focused()).toBe(false)
      expect(touched()).toBe(true)
    })

    it('leaves the Field when an as-child element changes, and reports the new element', async () => {
      const fires = removalFiresFocusout()
      const tag = ref('div')
      render(inField(() => h(DateFieldRoot as Component, { asChild: true }, {
        default: (props: SlotProps) => h(tag.value, { 'data-t': 'root', 'key': tag.value }, renderSegments(props)),
      })))
      await settle()
      const first = el('root')
      month().focus()
      await settle()

      tag.value = 'section'
      await settle()
      expect(el('root')).not.toBe(first)
      expectBlurredIfTheBrowserSaysSo(fires)

      month().focus()
      await settle()
      expect(focused()).toBe(true)
      el('outside')!.focus()
      await settle()
      expect(focused()).toBe(false)
      expect(touched()).toBe(true)
    })

    it('doesn\'t read a later programmatic value change as an edit', async () => {
      const fires = removalFiresFocusout()
      const Temporal = (globalThis as any).Temporal
      const modelValue = shallowRef(Temporal.PlainDate.from('2024-01-15'))
      const as = ref('div')
      const errors: unknown[] = []
      render(inField(() => h(DateFieldRoot as Component, {
        'as': as.value,
        'modelValue': modelValue.value,
        'onUpdate:modelValue': (value: unknown) => {
          modelValue.value = value
        },
      }, segments)))
      app!.config.errorHandler = error => errors.push(error)
      await settle()
      month().focus()
      await settle()

      as.value = 'section'
      await settle()
      modelValue.value = Temporal.PlainDate.from('2024-02-20')
      await settle()
      expect(el('field')!.hasAttribute('data-dirty')).toBe(false)
      if (fires) {
        expect(errors).toEqual([])
        expect(focused()).toBe(false)
      }
    })
  })

  // Vue merges the element's listeners after the part's on an as-child root, so the
  // part's state is already up to date in them, and a consumer can stop or redirect it.
  describe('with listeners on an as-child element', () => {
    function asChild(props: object) {
      return inField(() => h(DateFieldRoot as Component, { asChild: true }, {
        default: (slot: SlotProps) => h('section', { 'data-t': 'root', ...props }, renderSegments(slot)),
      }))
    }

    it('updates before the element\'s own listeners run', async () => {
      // The attributes render a tick later, so read the Field's state where it's kept.
      let field: ReturnType<typeof injectFieldRootContext>
      const Probe = defineComponent(() => {
        field = injectFieldRootContext(null)
        return () => null
      })
      const attribute = (name: 'data-focused' | 'data-touched') => field?.dataAttributes.value[name] !== undefined
      const seen: unknown[] = []
      render(inField(() => [h(Probe), h(DateFieldRoot as Component, { asChild: true }, {
        default: (slot: SlotProps) => h('section', {
          'data-t': 'root',
          'onFocusin': () => seen.push(['in', attribute('data-focused'), attribute('data-touched')]),
          'onFocusout': () => seen.push(['out', attribute('data-focused'), attribute('data-touched')]),
        }, renderSegments(slot)),
      })]))
      await settle()
      month().focus()
      await settle()
      el('outside')!.focus()
      await settle()
      expect(seen).toEqual([['in', true, false], ['out', false, true]])
    })

    it('reports a focus when the element stops `focusin`', async () => {
      render(asChild({ onFocusin: (event: Event) => event.stopImmediatePropagation() }))
      await settle()
      month().focus()
      await settle()
      expect(focused()).toBe(true)
    })

    it('reports a blur when the element stops `focusout`', async () => {
      render(asChild({ onFocusout: (event: Event) => event.stopImmediatePropagation() }))
      await settle()
      month().focus()
      await settle()
      el('outside')!.focus()
      await settle()
      expect(focused()).toBe(false)
      expect(touched()).toBe(true)
    })

    it('isn\'t left focused when the element moves focus out during `focusin`', async () => {
      render(asChild({ onFocusin: () => el('outside')!.focus() }))
      await settle()
      month().focus()
      await settle()
      expect(document.activeElement).toBe(el('outside'))
      expect(focused()).toBe(false)
      expect(touched()).toBe(true)
    })
  })
})
