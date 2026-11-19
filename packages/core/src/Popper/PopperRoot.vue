<script lang="ts">
export interface Measurable {
  getBoundingClientRect: () => DOMRect
}

export { injectPopperRootContext, providePopperRootContext } from './PopperRootContext'
</script>

<script setup lang="ts">
import type { ReferenceElement } from '@floating-ui/vue'
import type { PopperScope } from './PopperRootContext'
import { ref } from 'vue'
import { providePopperRootContext } from './PopperRootContext'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{ scope?: PopperScope }>()

const anchor = ref<ReferenceElement>()

providePopperRootContext({
  anchor,
  onAnchorChange: element => anchor.value = element,
}, props.scope)
</script>

<template>
  <slot />
</template>
