<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from '..'

const rootOpen = ref(false)
const rootDisabled = ref(false)
</script>

<template>
  <Story
    title="Collapsible/Demo"
    :layout="{ type: 'single', iframe: true }"
  >
    <Variant title="default">
      <CollapsibleRoot
        v-model:open="rootOpen"
        class="w-[300px]"
        :disabled="rootDisabled"
      >
        <div
          style="
            display: flex;
            align-items: center;
            justify-content: space-between;
          "
        >
          <span class="text-white text-[15px] leading-[25px]">
            @peduarte starred 3 repos
          </span>
          <CollapsibleTrigger
            class="cursor-default rounded-full h-[25px] w-[25px] inline-flex items-center justify-center text-violet11 shadow-[0_2px_10px] shadow-blackA7 outline-none data-[state=closed]:bg-white data-[state=open]:bg-violet3 hover:bg-violet3 focus:shadow-[0_0_0_2px] focus:shadow-black"
          >
            <Icon
              v-if="rootOpen"
              icon="radix-icons:cross-2"
              class="h-3.5 w-3.5"
            />
            <Icon
              v-else
              icon="radix-icons:row-spacing"
              class="h-3.5 w-3.5"
            />
          </CollapsibleTrigger>
        </div>

        <div
          class="bg-white rounded my-[10px] p-[10px] shadow-[0_2px_10px] shadow-blackA7"
        >
          <span class="text-violet11 text-[15px] leading-[25px]">unovue/reka-ui</span>
        </div>

        <CollapsibleContent class=" data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp">
          <div
            class="bg-white rounded my-[10px] p-[10px] shadow-[0_2px_10px] shadow-blackA7"
          >
            <span class="text-violet11 text-[15px] leading-[25px]">vuejs/core</span>
          </div>
          <div
            class="bg-white rounded my-[10px] p-[10px] shadow-[0_2px_10px] shadow-blackA7"
          >
            <span class="text-violet11 text-[15px] leading-[25px]">@radix-ui/primitives</span>
          </div>
        </CollapsibleContent>
      </CollapsibleRoot>
    </Variant>
  </Story>
</template>
