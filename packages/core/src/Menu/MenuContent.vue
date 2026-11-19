<script lang="ts">
import type {
  MenuContentImplEmits,
  MenuRootContentTypeProps,
} from './MenuContentImpl.vue'

export type MenuContentEmits = MenuContentImplEmits

export interface MenuContentProps extends MenuRootContentTypeProps {
  /**
   * Used to force mounting when more control is needed. Useful when
   * controlling animation with Vue animation libraries.
   */
  forceMount?: boolean
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Presence } from '@/Presence'
import { useForwardPropsEmits } from '@/shared'
import { vShowWhenKept } from '@/shared/vShowWhenKept'
import { injectMenuContext, injectMenuRootContext } from './MenuRoot.vue'
import MenuRootContentModal from './MenuRootContentModal.vue'
import MenuRootContentNonModal from './MenuRootContentNonModal.vue'

const props = defineProps<MenuContentProps>()
const emits = defineEmits<MenuContentImplEmits>()
const forwarded = useForwardPropsEmits(props, emits)

const menuContext = injectMenuContext()
const rootContext = injectMenuRootContext()

// When the root opts out of unmounting, the node stays in the DOM across open/close, and
// the child needs the real presence state, since no physical unmount happens to end the
// layer's side effects. A force-mounted content alone keeps counting as present, as before.
const staysMounted = computed(() => !rootContext.unmountOnHide.value)
// Hidden while closed only when kept mounted by the root: a force-mounted content is
// shown or hidden by the consumer. One branch either way, so that a change of
// `unmountOnHide` while open keeps the content and its state.
const hidesWhenClosed = computed(() => staysMounted.value && !props.forceMount)
const keptArg = computed(() => hidesWhenClosed.value ? 'kept' : null)
const contentComponent = computed(() => rootContext.modal.value ? MenuRootContentModal : MenuRootContentNonModal)
</script>

<template>
  <Presence
    v-slot="{ present }"
    :present="staysMounted ? menuContext.open.value : (forceMount || menuContext.open.value)"
    :force-mount="staysMounted"
  >
    <component
      :is="contentComponent"
      v-show-when-kept:[keptArg]="hidesWhenClosed ? present : true"
      v-bind="{ ...$attrs, ...forwarded }"
      :present="staysMounted ? present : true"
    >
      <slot />
    </component>
  </Presence>
</template>
