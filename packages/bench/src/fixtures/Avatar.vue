<script setup>
// Avatar: N instances of a typical composition (closed/default state)
import { AvatarFallback, AvatarImage, AvatarRoot } from 'reka-ui'

defineProps({ n: { type: Number, default: 100 } })
const src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <AvatarRoot>
      <AvatarImage
        :src="src"
        alt="A"
      /><AvatarFallback>AB</AvatarFallback>
    </AvatarRoot>
  </div>
</template>
