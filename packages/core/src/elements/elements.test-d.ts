import type { RekaElementEvent, RekaElementTagNameMap, RekaEventType, RekaIntrinsicElements, UseKebabCaseEventProp } from '.'
import { describe, expectTypeOf, it } from 'vitest'

// The opt-in documented in the "Custom elements" guide.
declare global {
  interface HTMLElementTagNameMap extends RekaElementTagNameMap {}
}

describe('element typings', () => {
  it('names events like `toEventType()`', () => {
    expectTypeOf<RekaEventType<'update:modelValue'>>().toEqualTypeOf<'update-model-value'>()
    expectTypeOf<RekaEventType<'beforeUpdate:open'>>().toEqualTypeOf<'before-update-open'>()
    expectTypeOf<RekaEventType<'escapeKeyDown'>>().toEqualTypeOf<'escape-key-down'>()
  })

  it('types the default-prefixed tags in `HTMLElementTagNameMap`', () => {
    const el = document.createElement('reka-switch-root')
    expectTypeOf(el.modelValue).toEqualTypeOf<boolean | null | undefined>()
    el.addEventListener('update-model-value', (event) => {
      expectTypeOf(event).toExtend<RekaElementEvent>()
      expectTypeOf(event.detail.value).toEqualTypeOf<boolean>()
      expectTypeOf(event.detail.details.cancel).toBeFunction()
    })
    // @ts-expect-error `as` is not part of the element API
    expectTypeOf(el.as).toBeUnknown()
  })

  it('types the menu, toast and arrow tags', () => {
    document.createElement('reka-dropdown-menu-item').addEventListener('select', (event) => {
      expectTypeOf(event.detail.value).toEqualTypeOf<Event>()
    })
    document.createElement('reka-toast-provider').addEventListener('update-toasts', (event) => {
      expectTypeOf(event.detail.value[0].id).toEqualTypeOf<string>()
    })
    expectTypeOf(document.createElement('reka-popover-arrow').rounded).toEqualTypeOf<boolean | undefined>()
  })

  it('types JSX event props in kebab-case, and steers away from camelCase handlers', () => {
    type Switch = RekaIntrinsicElements<{ defaultValue?: string, title?: string }>['reka-switch-root']
    type OnUpdate = NonNullable<Switch['onupdate-model-value']>
    expectTypeOf<Parameters<OnUpdate>[0]['detail']['value']>().toEqualTypeOf<boolean>()
    expectTypeOf<Switch['onUpdateModelValue']>().toEqualTypeOf<UseKebabCaseEventProp<'onupdate-model-value'> | undefined>()
    // The element's own `defaultValue` replaces the base attribute's.
    expectTypeOf<Switch['defaultValue']>().toEqualTypeOf<boolean | undefined>()
    expectTypeOf<Switch['title']>().toEqualTypeOf<string | undefined>()
  })
})
