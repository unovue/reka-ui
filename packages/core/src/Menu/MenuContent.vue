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
import { useForwardElement, useForwardPropsEmits } from '@/shared'
import { vShowWhenKept } from '@/shared/vShowWhenKept'
import { isPortalOpening } from '@/Teleport/portalGate'
import { injectMenuContext, injectMenuRootContext } from './MenuRoot.vue'
import MenuRootContentModal from './MenuRootContentModal.vue'
import MenuRootContentNonModal from './MenuRootContentNonModal.vue'

const props = defineProps<MenuContentProps>()
const emits = defineEmits<MenuContentImplEmits>()
const forwarded = useForwardPropsEmits(props, emits)

const menuContext = injectMenuContext()
const rootContext = injectMenuRootContext()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)

// When the root opts out of unmounting, the node stays in the DOM across open/close, and
// the child needs the real presence state, since no physical unmount happens to end the
// layer's side effects. A force-mounted content alone keeps counting as present, as before.
const staysMounted = computed(() => !rootContext.unmountOnHide.value)
// Hidden while closed only when kept mounted by the root: a force-mounted content is
// shown or hidden by the consumer. One branch either way, so that a change of
// `unmountOnHide` while open keeps the content and its state.
const hidesWhenClosed = computed(() => staysMounted.value && !props.forceMount)
const keptArg = computed(() => hidesWhenClosed.value ? 'kept' : null)
// A closing content still mounted for its exit animation hands Escape, outside interaction
// and the accessibility tree back to the layer below at once. A force-mounted content keeps
// its layer while closed, as before.
const layerPresent = computed(() => menuContext.open.value || !!props.forceMount)
const contentComponent = computed(() => rootContext.modal.value ? MenuRootContentModal : MenuRootContentNonModal)
</script>

<template>
  <Presence
    v-slot="{ present }"
    :ref="forwardRef"
    :appear="isPortalOpening(menuContext)"
    :present="menuContext.open.value"
    :force-mount="forceMount || staysMounted"
    @complete="menuContext.notifyOpenComplete"
  >
    <component
      :is="contentComponent"
      v-show-when-kept:[keptArg]="hidesWhenClosed ? present : true"
      v-bind="{ ...$attrs, ...forwarded }"
      :present="staysMounted ? present : true"
      :layer-present="(staysMounted ? present : true) && layerPresent"
    >
      <slot />
    </component>
  </Presence>
</template>
