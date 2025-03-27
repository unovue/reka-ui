import { type Component, type PropType, defineComponent, h, computed } from 'vue'
import { Slot } from './Slot.ts'

export type AsTag =
  | 'a'
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
   * Read our [Composition](https://www.radix-vue.com/guides/composition.html) guide for more details.
   */
  asChild?: boolean
  /**
   * The element or component this component should render as. Can be overwritten by `asChild`.
   * @defaultValue "div"
   */
  as?: AsTag | Component
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
    const asTag = computed(() => (props.asChild ? 'template' : props.as))
    return () => {
      const SELF_CLOSING_TAGS = ['area', 'img', 'input']

      if (typeof asTag.value === 'string' && SELF_CLOSING_TAGS.includes(asTag.value)) {
        return h(asTag.value, attrs)
      }

      if (asTag.value !== 'template') {
        return h(props.as, attrs, slots)
      }

      return h(Slot, attrs, { default: slots.default })
    }
  },
})
