<script lang="ts">
import type {
  SelectContentImplEmits,
  SelectContentImplProps,
} from './SelectContentImpl.vue'
import { computed, onMounted, ref, useAttrs, watch } from 'vue'

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

// Whether the root is still the content, which stays until its exit is over.
// It follows the Presence one step behind: the Presence takes its element out
// in its own update, and only then does the root swap to the fragment below.
// Swapping in the update that ends the Presence would mount the fragment's
// holder while a Vue `<Transition>` around the content is starting its leave,
// and entering a new root there ends that leave at once. A post-flush watcher
// runs in the same tick, so the options are still never missing from a paint
// and the trigger keeps its label.
const renderPresence = ref(present.value)
watch(
  [present, () => presenceRef.value?.present],
  ([isPresent, isPresenceMounted]) => {
    renderPresence.value = isPresent || !!isPresenceMounted
  },
  { flush: 'post' },
)

// The agent marks written on the content still cover its items while they render off the page.
const attrs = useAttrs()
// Read on each render: attrs aren't reactive, and a change to them renders the component again.
const agentMarks = () => Object.fromEntries(Object.entries(attrs).filter(([key]) => key.startsWith('data-agent-')))
</script>

<template>
  <Presence
    v-if="present || renderPresence"
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
          <div v-bind="agentMarks()">
            <slot />
          </div>
        </CollectionSlot>
      </SelectProvider>
    </Teleport>
  </div>
</template>
