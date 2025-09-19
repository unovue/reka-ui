<script setup lang="ts">
import { ref } from 'vue'
import { RadioGroupIndicator, RadioGroupItem, RadioGroupRoot } from '..'

const radioStateSingle = ref('compact')
</script>

<template>
  <Story
    title="Radio Group/Demo"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="default">
      <RadioGroupRoot
        v-model="radioStateSingle"
        :loop="false"
        class="flex flex-col gap-2.5"
        aria-label="View density"
      >
        <div class="flex items-center">
          <RadioGroupItem
            id="r1"
            class="bg-white w-[25px] h-[25px] rounded-full shadow-[0_2px_10px] shadow-blackA7 hover:bg-violet3 focus:shadow-[0_0_0_2px] focus:shadow-black outline-none cursor-default data-[disabled]:bg-red-500"
            value="default"
          >
            <RadioGroupIndicator
              class="flex items-center justify-center w-full h-full relative after:content-[''] after:block after:w-[11px] after:h-[11px] after:rounded-[50%] after:bg-violet11"
            />
          </RadioGroupItem>
          <label
            class="text-white text-[15px] leading-none pl-[15px]"
            for="r1"
          >
            Default
          </label>
        </div>
        <div class="flex items-center">
          <RadioGroupItem
            id="r2"
            class="bg-white w-[25px] h-[25px] rounded-full shadow-[0_2px_10px] shadow-blackA7 hover:bg-violet3 focus:shadow-[0_0_0_2px] focus:shadow-black outline-none cursor-default data-[disabled]:bg-red-500"
            value="comfortable"
          >
            <RadioGroupIndicator
              class="flex items-center justify-center w-full h-full relative after:content-[''] after:block after:w-[11px] after:h-[11px] after:rounded-[50%] after:bg-violet11"
            />
          </RadioGroupItem>
          <label
            class="text-white text-[15px] leading-none pl-[15px]"
            for="r2"
          >
            Comfortable
          </label>
        </div>
        <div class="flex items-center">
          <RadioGroupItem
            id="r3"
            as-child
            class="bg-white w-[25px] h-[25px] rounded-full shadow-[0_2px_10px] shadow-blackA7 hover:bg-violet3 focus:shadow-[0_0_0_2px] focus:shadow-black outline-none cursor-default"
            value="compact"
          >
            <button>
              <RadioGroupIndicator
                class="flex items-center justify-center w-full h-full relative after:content-[''] after:block after:w-[11px] after:h-[11px] after:rounded-[50%] after:bg-violet11"
              />
            </button>
          </RadioGroupItem>
          <label
            class="text-white text-[15px] leading-none pl-[15px]"
            for="r3"
          >
            Compact
          </label>
        </div>
      </RadioGroupRoot>
    </Variant>
  </Story>
</template>
