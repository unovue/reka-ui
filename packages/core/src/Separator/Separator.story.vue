<script setup lang="ts">
import { Separator } from '.'
</script>

<template>
  <Story
    title="Separator/Demo"
    :layout="{ type: 'single', iframe: true }"
  >
    <Variant title="default">
      <div class="w-full max-w-[300px] mx-[15px]">
        <div class="text-white text-[15px] leading-5 font-medium">
          Reka UI
        </div>
        <div class="text-white text-[15px] leading-5">
          An open-source UI component library.
        </div>
        <Separator
          decorative
          class="bg-[#d7cff9] data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px my-[15px]"
        />
        <div class="flex h-5 items-center">
          <div class="text-white text-[15px] leading-5">
            Blog
          </div>
          <Separator
            class="bg-[#d7cff9] data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px mx-[15px]"
            decorative
            orientation="vertical"
          />
          <div class="text-white text-[15px] leading-5">
            Docs
          </div>
          <Separator
            class="bg-[#d7cff9] data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px mx-[15px]"
            decorative
            orientation="vertical"
          />
          <div class="text-white text-[15px] leading-5">
            Source
          </div>
        </div>
      </div>
    </Variant>
  </Story>
</template>
