<script setup lang="ts">
import type { DrawerBackdropProps, DrawerPopupEmits, DrawerPopupProps } from 'reka-ui'

defineProps<DrawerPopupProps>()
defineEmits<DrawerPopupEmits>()

type Backdrop = DrawerBackdropProps
</script>

<template>
  <p>drawer popup</p>
</template>
