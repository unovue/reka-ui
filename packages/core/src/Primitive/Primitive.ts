import type { Component, PropType } from 'vue'
import { defineComponent, h } from 'vue'
import { Slot } from './Slot'

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
const SELF_CLOSING_TAGS = ['area', 'img', 'input']

// A plain object with a `template` string and no render function, directly or through
// `extends` / `mixins`, would be compiled at render time. Components from the app always
// carry a `render`, `ssrRender` or `setup` function.
function isTemplateObject(value: unknown): boolean {
  if (!value || typeof value !== 'object')
    return false

  const component = value as Record<string, any>
  if (typeof component.render === 'function' || typeof component.ssrRender === 'function' || typeof component.setup === 'function')
    return false

  // A plain VNode or built-in marker would render its `type` and `props` as is.
  // The built-ins themselves carry functions (`process`), plain data never does.
  if ((component.__v_isVNode || component.__isTeleport || component.__isSuspense || component.__isKeepAlive) && !Object.values(component).some(item => typeof item === 'function'))
    return true

  return typeof component.template === 'string'
    || isTemplateObject(component.extends)
    || (Array.isArray(component.mixins) && component.mixins.some(isTemplateObject))
}

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
    const asTag = props.asChild ? 'template' : props.as

    if (typeof asTag === 'string' && SELF_CLOSING_TAGS.includes(asTag))
      return () => h(asTag, attrs)

    if (asTag !== 'template')
      return () => h(isTemplateObject(props.as) ? 'div' : props.as, attrs, { default: slots.default })

    return () => h(Slot, attrs, { default: slots.default })
  },
})
