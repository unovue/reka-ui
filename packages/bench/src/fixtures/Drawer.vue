<script setup>
// Drawer: N instances of a typical composition (closed/default state)
import { DrawerClose, DrawerContent, DrawerDescription, DrawerGrabber, DrawerOverlay, DrawerPortal, DrawerRoot, DrawerTitle, DrawerTrigger } from 'reka-ui'

defineProps({ n: { type: Number, default: 100 } })
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <DrawerRoot>
      <DrawerTrigger class="trg">
        Open
      </DrawerTrigger>
      <DrawerPortal>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerGrabber />
          <DrawerTitle>Title</DrawerTitle>
          <DrawerDescription>Description</DrawerDescription>
          <DrawerClose>Close</DrawerClose>
        </DrawerContent>
      </DrawerPortal>
    </DrawerRoot>
  </div>
</template>
