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

  // Vue's full build also compiles an element-like `template` (`nodeType` + `innerHTML`)
  return typeof component.template === 'string'
    || (typeof component.template === 'object' && component.template !== null)
    || isTemplateObject(component.extends)
    || (Array.isArray(component.mixins) && component.mixins.some(isTemplateObject))
}

// Elements that run or load code from their content or attributes (`srcdoc`, `data`, …).
// `style` stays allowed, the viewports render their own `<style>` through `Primitive`.
const UNSAFE_TAGS = ['script', 'iframe', 'frame', 'frameset', 'object', 'embed', 'applet', 'base', 'link', 'meta', 'noscript']

const TAG_NAME = /^[a-z][a-z0-9-]*$/i

function isUnsafeAs(value: unknown): boolean {
  // A string that isn't a plain tag name (`img src=x onerror=…`) ends up as raw markup in the opening tag
  if (typeof value === 'string')
    return !TAG_NAME.test(value) || UNSAFE_TAGS.includes(value.toLowerCase())
  return isTemplateObject(value)
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
      return () => h(isUnsafeAs(props.as) ? 'div' : props.as, attrs, { default: slots.default })

    return () => h(Slot, attrs, { default: slots.default })
  },
})
