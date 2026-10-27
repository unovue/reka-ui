import type { Component, PropType } from 'vue'
import { defineComponent, h } from 'vue'
import { useRender } from './useRender'

export type AsTag
  = | 'a'
    | 'button'
    | 'div'
    | 'form'
    | 'h2'
    | 'h3'
    | 'img'
    | 'input'
    | 'label'
    | 'li'
    | 'nav'
    | 'ol'
    | 'p'
    | 'span'
    | 'svg'
    | 'ul'
    | 'template'
    | ({} & string) // any other string

export interface PrimitiveProps {
  /**
   * Change the default rendered element for the one passed as a child, merging their props and behavior.
   *
   * Read our [Composition](https://www.reka-ui.com/docs/guides/composition) guide for more details.
   */
  asChild?: boolean
  /**
   * The element or component this component should render as. Can be overwritten by `asChild`.
   * @defaultValue "div"
   */
  as?: AsTag | Component
}

// For self closing tags, don't provide default slots because of hydration issue
export const SELF_CLOSING_TAGS = ['area', 'img', 'input']

export const Primitive = defineComponent({
  name: 'Primitive',
  inheritAttrs: false,
  props: {
    asChild: {
      type: Boolean,
      default: false,
    },
    as: {
      type: [String, Object] as PropType<AsTag | Component>,
      default: 'div',
    },
  },
  setup(props, { attrs, slots, expose }) {
    // Compat shim over useRender. Primitive satisfies the element-first contract
    // (#2808): a parent `:ref` receives `{ element, $el }`, both the same
    // reactive ref, so wrapping parts resolve the rendered element — including
    // across `asChild` child swaps (the `Slot` tracks its child) — with no
    // `instance.exposed` mutation and no `onUpdated` resync.
    const { tag, renderProps, selfClosing, state, elementRef, expose: elementExpose } = useRender({
      defaultTagName: 'div',
      as: () => props.as,
      asChild: () => props.asChild,
      props: attrs,
    })
    expose(elementExpose)

    return () => {
      // Honor the opt-in `#render` contract (parity with parts built on
      // useRender): the consumer owns the element and binds `props`/`forwardRef`
      // itself, so `#render` takes precedence over the default/`asChild` render.
      if (slots.render) {
        return slots.render({
          props: renderProps.value,
          state: state.value,
          forwardRef: elementRef,
        })
      }

      return h(
        tag.value,
        { ...renderProps.value, ref: elementRef },
        selfClosing.value ? undefined : { default: slots.default },
      )
    }
  },
})
