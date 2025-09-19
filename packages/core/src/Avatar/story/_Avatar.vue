<script setup lang="ts">
import { AvatarFallback, AvatarImage, AvatarRoot } from '..'

defineProps<{ delay?: number }>()
</script>

<template>
  <AvatarRoot
    class="bg-blackA3 inline-flex h-[45px] w-[45px] select-none items-center justify-center overflow-hidden rounded-full align-middle"
  >
    <AvatarImage
      class="h-full w-full rounded-[inherit] object-cover"
      src="https://images.unsplash.com/photo-1492633423870-43d1cd2775eb?&w=128&h=128&dpr=2&q=80"
      alt="Colm Tuite"
    />
    <AvatarFallback
      class="text-violet11 leading-1 flex h-full w-full items-center justify-center bg-white text-[15px] font-medium"
      :delay-ms="delay"
    >
      CT
    </AvatarFallback>
  </AvatarRoot>
</template>
