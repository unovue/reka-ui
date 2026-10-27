<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useCollection } from '@/Collection'
import { useForwardElement } from '@/shared'

export type NavigationMenuLinkEmits = {
  /**
   * Event handler called when the user selects a link (via mouse or keyboard).
   *
   * Calling `event.preventDefault` in this handler will prevent the navigation menu from closing when selecting that link.
   */
  select: [payload: CustomEvent<{ originalEvent: Event }>]
}
export interface NavigationMenuLinkProps extends PrimitiveProps {
  /** Used to identify the link as the currently active page. */
  active?: boolean
}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { useNavigationMenuLink } from './useNavigationMenu'

const props = withDefaults(defineProps<NavigationMenuLinkProps>(), {
  as: 'a',
})

const emits = defineEmits<NavigationMenuLinkEmits>()

const { CollectionItem } = useCollection({ key: 'NavigationMenu' })
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)

const { link } = useNavigationMenuLink({
  active: () => props.active,
  onSelect: event => emits('select', event),
})
</script>

<template>
  <CollectionItem :ref="forwardRef">
    <Primitive
      v-bind="link.attrs.value"
      :as="as"
      :as-child="props.asChild"
    >
      <slot />
    </Primitive>
  </CollectionItem>
</template>
