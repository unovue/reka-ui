<script lang="ts">
import type {
  SelectContentImplEmits,
  SelectContentImplProps,
} from './SelectContentImpl.vue'
import { computed, onMounted, ref } from 'vue'

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
import { useCollection } from '@/Collection'
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
// While closed, the items still render into the fragment below. Mark it as the
// collection so the trigger's typeahead can find them, as Radix does.
const { CollectionSlot } = useCollection()

const fragment = ref<DocumentFragment>()
onMounted(() => {
  fragment.value = new DocumentFragment()
})

const presenceRef = ref<InstanceType<typeof Presence>>()

const present = computed(() => props.forceMount || rootContext.open.value)
</script>

<template>
  <Presence
    v-if="present || presenceRef?.present"
    ref="presenceRef"
    :present="present"
  >
    <SelectContentImpl v-bind="{ ...forwarded, ...$attrs }">
      <slot />
    </SelectContentImpl>
  </Presence>

  <div v-else-if="fragment">
    <Teleport :to="fragment">
      <SelectProvider :context="rootContext">
        <CollectionSlot>
          <div>
            <slot />
          </div>
        </CollectionSlot>
      </SelectProvider>
    </Teleport>
  </div>
</template>
