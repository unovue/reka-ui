<script setup lang="ts">
import { ref } from 'vue'
import { SwitchRoot, SwitchThumb } from '.'

const switchState = ref(true)
const customStringState = ref<'on' | 'off'>('off')
const customNumberState = ref<1 | 0>(0)
</script>

<template>
  <Story
    title="Switch/Demo"
    :layout="{ type: 'single', iframe: true }"
  >
    <Variant title="default">
      <div class="flex gap-2 items-center">
        <label
          class="text-white text-[15px] leading-none pr-[15px]"
          for="airplane-mode"
        >
          Airplane mode
        </label>
        <SwitchRoot
          id="airplane-mode"
          v-model="switchState"
          class="w-[42px] h-[25px] focus-within:outline focus-within:outline-black flex bg-black/50 shadow-sm rounded-full relative data-[state=checked]:bg-black cursor-default"
        >
          <SwitchThumb
            class="block w-[21px] h-[21px] my-auto bg-white shadow-sm rounded-full transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[19px]"
          />
        </SwitchRoot>
      </div>
    </Variant>

    <Variant title="Custom string values">
      <div class="flex flex-col gap-4">
        <div class="flex gap-2 items-center">
          <label
            class="text-white text-[15px] leading-none pr-[15px]"
            for="custom-string"
          >
            Status
          </label>
          <SwitchRoot
            id="custom-string"
            v-model="customStringState"
            true-value="on"
            false-value="off"
            class="w-[42px] h-[25px] focus-within:outline focus-within:outline-black flex bg-black/50 shadow-sm rounded-full relative data-[state=checked]:bg-black cursor-default"
          >
            <SwitchThumb
              class="block w-[21px] h-[21px] my-auto bg-white shadow-sm rounded-full transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[19px]"
            />
          </SwitchRoot>
        </div>
        <span class="text-white text-sm">v-model value: "{{ customStringState }}"</span>
      </div>
    </Variant>

    <Variant title="Custom number values">
      <div class="flex flex-col gap-4">
        <div class="flex gap-2 items-center">
          <label
            class="text-white text-[15px] leading-none pr-[15px]"
            for="custom-number"
          >
            Permission
          </label>
          <SwitchRoot
            id="custom-number"
            v-model="customNumberState"
            :true-value="1"
            :false-value="0"
            class="w-[42px] h-[25px] focus-within:outline focus-within:outline-black flex bg-black/50 shadow-sm rounded-full relative data-[state=checked]:bg-black cursor-default"
          >
            <SwitchThumb
              class="block w-[21px] h-[21px] my-auto bg-white shadow-sm rounded-full transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[19px]"
            />
          </SwitchRoot>
        </div>
        <span class="text-white text-sm">v-model value: {{ customNumberState }}</span>
      </div>
    </Variant>
  </Story>
</template>
