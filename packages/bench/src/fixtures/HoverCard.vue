<script setup>
// HoverCard: N instances of a typical composition (closed/default state)
import { HoverCardArrow, HoverCardContent, HoverCardPortal, HoverCardRoot, HoverCardTrigger } from 'reka-ui'

defineProps({ n: { type: Number, default: 100 } })
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <HoverCardRoot
      :open-delay="0"
      :close-delay="0"
    >
      <HoverCardTrigger
        class="trg"
        href="#"
      >
        @user
      </HoverCardTrigger>
      <HoverCardPortal>
        <HoverCardContent class="hc-content">
          Profile<HoverCardArrow />
        </HoverCardContent>
      </HoverCardPortal>
    </HoverCardRoot>
  </div>
</template>
