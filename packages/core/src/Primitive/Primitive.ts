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
  setup(props, { attrs, slots }) {
    // Compat shim over useRender. NOTE: do not bind `elementRef` here — the shim
    // must not mutate its own instance.exposed (parts put `:ref="forwardRef"` on
    // <Primitive> and read instance.vnode.el). We only consume tag/renderProps.
    const { tag, renderProps, selfClosing } = useRender({
      defaultTagName: 'div',
      as: () => props.as,
      asChild: () => props.asChild,
      props: attrs,
    })

    return () => h(
      tag.value,
      renderProps.value,
      selfClosing.value ? undefined : { default: slots.default },
    )
  },
})
