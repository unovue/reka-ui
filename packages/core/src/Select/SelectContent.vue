<script lang="ts">
import type {
  SelectContentImplEmits,
  SelectContentImplProps,
} from './SelectContentImpl.vue'
import { onMounted, ref } from 'vue'

export type SelectContentEmits = SelectContentImplEmits

export interface SelectContentProps extends SelectContentImplProps {
  /**
   * Used to force mounting when more control is needed. Useful when
   * controlling animation with Vue animation libraries.
   *
   * @deprecated Because we use force-mount in <Presence> to keep it alive and thus drive the state transitions of its children, this prop no longer takes effect.
   *
   */
  forceMount?: boolean
}
</script>

<script setup lang="ts">
import { Presence } from '@/Presence'
import { useForwardPropsEmits } from '@/shared'
import SelectContentImpl from './SelectContentImpl.vue'
import SelectProvider from './SelectProvider.vue'
import { injectSelectRootContext } from './SelectRoot.vue'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<SelectContentProps>()
const emits = defineEmits<SelectContentEmits>()
const forwarded = useForwardPropsEmits(props, emits)
const rootContext = injectSelectRootContext()
const fragment = ref<DocumentFragment>()

onMounted(() => {
  fragment.value = new DocumentFragment()
})
</script>

<template>
  <Presence
    v-slot="{ present }"
    :present="rootContext.open.value"
    force-mount
  >
    <SelectContentImpl
      v-if="present"
      v-bind="{ ...forwarded, ...$attrs }"
    >
      <slot />
    </SelectContentImpl>
    <Teleport
      v-else-if="fragment && !present"
      :to="fragment"
    >
      <SelectProvider :context="rootContext">
        <slot />
      </SelectProvider>
    </Teleport>
  </Presence>
</template>
