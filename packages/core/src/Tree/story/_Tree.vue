<script setup lang="ts">
import type { TreeRootEmits, TreeRootProps } from '..'
import { useForwardPropsEmits } from '@/shared'
import { TreeRoot } from '..'

const props = defineProps<TreeRootProps>()
const emits = defineEmits<TreeRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)

const paths = [
  'index.vue',
  'lib/tree/Tree.vue',
  'lib/tree/TreeView.vue',
  'lib/icons/JS.vue',
  'lib/icons/vue.vue',
  'lib/index.js',
  'routes/contents/+layout.vue',
  'routes/contents/+page.vue',
]
</script>

<template>
  <TreeRoot
    v-bind="forwarded"
    class="w-64 h-80 bg-white text-blackA11 rounded-md text-sm font-medium"
    :paths="paths"
    initial-expansion="open"
    search
  />
</template>
