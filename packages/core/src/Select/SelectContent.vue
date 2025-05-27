<script lang="ts">
import type {
  SelectContentImplEmits,
  SelectContentImplProps,
} from './SelectContentImpl.vue'

export type SelectContentEmits = SelectContentImplEmits

export interface SelectContentProps extends SelectContentImplProps {
  /**
   * Used to force mounting when more control is needed. Useful when
   * controlling animation with Vue animation libraries.
   */
  forceMount?: boolean
}
</script>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
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

const presenceRef = ref<InstanceType<typeof Presence>>()
const renderPresence = computed(() => props.forceMount || rootContext.open.value)
</script>

<template>
  <Presence
    v-if="renderPresence"
    ref="presenceRef"
    :present="true"
  >
    <SelectContentImpl v-bind="{ ...forwarded, ...$attrs }">
      <slot />
    </SelectContentImpl>
  </Presence>

  <div v-else-if="!presenceRef?.present && fragment">
    <Teleport :to="fragment">
      <SelectProvider :context="rootContext">
        <slot />
      </SelectProvider>
    </Teleport>
  </div>
</template>
