<script setup>
// Popover: N instances of a typical composition (closed/default state)
import { PopoverArrow, PopoverClose, PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'reka-ui'

defineProps({ n: { type: Number, default: 100 } })
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <PopoverRoot>
      <PopoverTrigger class="trg">
        More
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverContent class="pop-content">
          Settings<PopoverClose>x</PopoverClose><PopoverArrow />
        </PopoverContent>
      </PopoverPortal>
    </PopoverRoot>
  </div>
</template>
