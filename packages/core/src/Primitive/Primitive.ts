import type { AriaAttributes, Component, DefineSetupFnComponent, HTMLAttributes, PropType } from 'vue'
import { defineComponent, getCurrentInstance, h, mergeProps, toRaw } from 'vue'
// Direct relative import (not the `@/shared` barrel) to avoid a Primitive ↔ shared cycle.
import { useForwardElement } from '../shared/useForwardElement'
import { Slot } from './Slot'
import { isSelfClosingTag, resolveRenderTag, warnRenderSlotWithAsChild } from './useRender'

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

/** The global HTML attributes `PrimitiveHTMLAttributes` types, besides `aria-*`. */
type GlobalAttribute
  = | 'class'
    | 'style'
    | 'id'
    | 'role'
    | 'tabindex'
    | 'title'
    | 'lang'
    | 'hidden'
    | 'inert'
    | 'draggable'
    | 'spellcheck'
    | 'contenteditable'
    | 'accesskey'
    | 'enterkeyhint'
    | 'inputmode'
    | 'part'

/**
 * The DOM listeners `PrimitiveHTMLAttributes` types. None is named after an event a
 * Reka component emits (`select`, `toggle`, `change`, …): intersected with the
 * emit, the payload would type as `Event | <payload>`.
 */
type CommonListener
  = | 'onClick'
    | 'onDblclick'
    | 'onContextmenu'
    | 'onKeydown'
    | 'onKeyup'
    | 'onFocus'
    | 'onBlur'
    | 'onFocusin'
    | 'onFocusout'
    | 'onPointerdown'
    | 'onPointerup'
    | 'onPointermove'
    | 'onPointerenter'
    | 'onPointerleave'
    | 'onMouseenter'
    | 'onMouseleave'
    | 'onMousedown'
    | 'onMouseup'
    | 'onTouchstart'
    | 'onTouchend'
    | 'onWheel'
    | 'onScroll'
    | 'onCopy'
    | 'onPaste'
    | 'onAnimationend'
    | 'onTransitionend'

/**
 * HTML attributes a component passes to its element: `aria-*`, common global
 * attributes (`class`, `style`, `id`, `role`, `tabindex`, …) and common DOM
 * listeners (`@click`, `@keydown`, `@focus`, …). Type-only: `PrimitiveProps`
 * extends it under `@vue-ignore`, so no runtime prop is declared and the
 * attributes still fall through. With `strictTemplates`, it lets
 * `<DialogContent aria-label="…">` type-check. Other attributes and listeners
 * fall through all the same, untyped.
 */
export interface PrimitiveHTMLAttributes extends AriaAttributes, Pick<HTMLAttributes, GlobalAttribute | CommonListener> {
  autofocus?: boolean | 'true' | 'false'
  nonce?: string
  slot?: string
}

export interface PrimitiveProps extends /* @vue-ignore */ PrimitiveHTMLAttributes {
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

/**
 * Whether `attrs` holds something `mergeProps` normalises: a string `style`
 * (patched as an object, so inline properties set imperatively survive a
 * change), a falsy `on*` handler or the `''` key, both of which it drops.
 * Otherwise a plain copy renders the same and costs less.
 */
function needsMergeProps(attrs: Record<string, unknown>): boolean {
  for (const key in attrs) {
    if (key === 'style' ? typeof attrs.style === 'string' : key === '' || (key.startsWith('on') && !attrs[key]))
      return true
  }
  return false
}

/**
 * Typed with the HTML attributes it passes to its element (`PrimitiveProps`), so
 * `<Primitive as="nav" aria-label="…">` type-checks with `strictTemplates`.
 */
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
  // `setup(props)` only: a second parameter makes Vue allocate a setup context
  // (with an attrs proxy and an `expose` closure) per instance. The instance
  // already holds the same attrs and slots objects, updated in place.
  setup(props) {
    const instance = getCurrentInstance()!
    const { attrs, slots } = instance
    // Same output as `useRender({ as, asChild, props: attrs })`, resolved in the
    // render function instead of through computeds: Primitive wraps nearly every
    // part, so its per-instance reactive cost is multiplied by every part on the
    // page. It satisfies the element-first contract (#2808): a parent `:ref`
    // receives `{ element, $el }`, both the same reactive ref, so wrapping parts
    // resolve the rendered element — including across `asChild` child swaps (the
    // `Slot` tracks its child) — with no `onUpdated` resync. The element ref
    // itself is created on first read.
    const { forwardRef: elementRef, expose: elementExpose } = useForwardElement<HTMLElement>()
    // What the setup context's `expose()` does.
    instance.exposed = elementExpose
    // Render reads the raw props and attrs (`props` is reactive): new
    // props/attrs only ever arrive with a parent patch, which re-renders this
    // component anyway, so tracking them would add a dep + link per key per
    // Primitive for nothing.
    const rawProps = toRaw(props)

    // eslint-disable-next-line node/prefer-global/process
    if (process.env.NODE_ENV !== 'production')
      warnRenderSlotWithAsChild(resolveRenderTag(props.as, props.asChild) === Slot)

    return () => {
      // Honor the opt-in `#render` contract (parity with parts built on
      // useRender): the consumer owns the element and binds `props`/`forwardRef`
      // itself, so `#render` takes precedence over the default/`asChild` render.
      if (slots.render) {
        return slots.render({
          props: mergeProps(attrs),
          state: undefined,
          forwardRef: elementRef,
        })
      }

      const tag = resolveRenderTag(rawProps.as, rawProps.asChild)
      const vnodeProps = needsMergeProps(attrs) ? mergeProps(attrs) : { ...attrs }
      vnodeProps.ref = elementRef
      return h(
        tag,
        vnodeProps,
        isSelfClosingTag(tag) ? undefined : { default: slots.default },
      )
    }
  },
}) as unknown as DefineSetupFnComponent<PrimitiveProps>
