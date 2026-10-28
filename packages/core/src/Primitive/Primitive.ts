import type { Component, PropType } from 'vue'
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
    // Same output as `useRender({ as, asChild, props: attrs })`, resolved in the
    // render function instead of through computeds: Primitive wraps nearly every
    // part, so its per-instance reactive cost is multiplied by every part on the
    // page. It satisfies the element-first contract (#2808): a parent `:ref`
    // receives `{ element, $el }`, both the same reactive ref, so wrapping parts
    // resolve the rendered element — including across `asChild` child swaps (the
    // `Slot` tracks its child) — with no `instance.exposed` mutation and no
    // `onUpdated` resync. The element ref itself is created on first read.
    const { forwardRef: elementRef, expose: elementExpose } = useForwardElement<HTMLElement>()
    expose(elementExpose)
    // Render reads the raw props and attrs (`props` is reactive and `attrs` a
    // tracking proxy): new props/attrs only ever arrive with a parent patch,
    // which re-renders this component anyway, so tracking them would add a
    // dep + link per key per Primitive for nothing (and spreading the raw attrs
    // object is much cheaper than spreading the proxy).
    const rawProps = toRaw(props)
    const rawAttrs = getCurrentInstance()?.attrs ?? attrs

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
      return h(
        tag,
        { ...rawAttrs, ref: elementRef },
        isSelfClosingTag(tag) ? undefined : { default: slots.default },
      )
    }
  },
})
