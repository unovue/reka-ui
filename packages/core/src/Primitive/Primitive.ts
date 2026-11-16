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

// JSON-shaped values Vue would still render as a component: an object with a `template`
// (string or element-like) anywhere in its `extends` / `mixins` chain, or a VNode / built-in / reactive
// marker, and no `render`, `ssrRender` or `setup` of its own. Vue's full build compiles a merged
// `template` even when a mixin provides `render`, so only the component's own functions count.
function hasTemplate(value: any): boolean {
  return !!value && typeof value === 'object' && (!!value.template || hasTemplate(value.extends) || (Array.isArray(value.mixins) && value.mixins.some(hasTemplate)))
}

function isTemplateObject(value: unknown): boolean {
  if (!value || typeof value !== 'object')
    return false

  const component = value as Record<string, any>
  if (typeof component.render === 'function' || typeof component.ssrRender === 'function' || typeof component.setup === 'function')
    return false

  // The built-ins carry functions (`process`), plain data never does. `__v_raw` is unwrapped by Vue in development
  if ((component.__v_isVNode || component.__isTeleport || component.__isSuspense || component.__isKeepAlive || component.__v_raw) && !Object.values(component).some(item => typeof item === 'function'))
    return true

  return hasTemplate(component)
}

// A string that isn't a plain tag name (`img src=x onerror=…`) ends up as raw markup in the opening tag,
// and these tags run or load code from their content or attributes. `style` stays allowed, the viewports
// render their own `<style>` through `Primitive`.
const SAFE_TAG = /^(?!(?:script|iframe|frame|frameset|object|embed|applet|base|link|meta|noscript)$)[a-z][a-z0-9-]*$/i

function isUnsafeAs(value: unknown): boolean {
  return typeof value === 'string' ? !SAFE_TAG.test(value) : isTemplateObject(value)
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
