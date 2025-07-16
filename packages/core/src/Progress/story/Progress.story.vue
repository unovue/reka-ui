<script setup lang="ts">
import { ref } from 'vue'
import { ProgressIndicator, ProgressRoot } from '..'

const interactive = ref(0)
setInterval(() => {
  // For some reason, this interval triggers twice in the same tick
  interactive.value = (interactive.value + Math.random() * 15) % 100
}, 2000)

const errorCaseValue = ref(1)
const errorCaseMax = ref(100)
</script>

<template>
  <Story
    title="Progress/Demo"
    :layout="{ type: 'single', iframe: true }"
  >
    <Variant title="Loop">
      <ProgressRoot
        v-model="interactive"
        class="relative flex items-center justify-center w-full h-8 overflow-hidden rounded-full bg-blackA9 full"
      >
        <ProgressIndicator
          class="w-full h-full transition-transform duration-1000 bg-white"
          :style="`transform: translateX(-${100 - interactive}%)`"
        />
        <div
          class="absolute font-mono text-xs font-bold tracking-widest text-center text-green-400 uppercase pointer-events-none mix-blend-normal"
        >
          {{ interactive.toFixed(2) }}%
        </div>
      </ProgressRoot>
    </Variant>
    <Variant title="Indeterminate">
      <ProgressRoot
        class="relative flex items-center justify-center w-full h-8 overflow-hidden rounded-full bg-blackA9 full"
      >
        <ProgressIndicator class="w-full h-full bg-white/20" />
        <div
          class="absolute font-mono text-xs font-bold tracking-widest text-center text-green-400 uppercase pointer-events-none mix-blend-normal"
        >
          Progress value is null
        </div>
      </ProgressRoot>

      <p
        class="px-3 py-4 mt-10 text-sm rounded-md bg-slate-500/80 text-slate-100"
      >
        When there is no value provided, the progress indicator will be
        <code class="text-green-400">indeterminate</code>.
      </p>
    </Variant>
    <Variant title="Errors">
      <template #controls>
        <div class="flex flex-col">
          Value:
          <input
            v-model="errorCaseValue"
            class="text-slate-800 bg-slate-300"
            type="number"
          >
          Max:
          <input
            v-model="errorCaseMax"
            class="text-slate-800 bg-slate-300"
            type="number"
          >
        </div>
      </template>

      <div class="px-2 py-3 rounded-sm bg-slate-600 text-slate-200">
        <p class="mb-4 text-sm rounded-md text-amber-300">
          Change the values in the "Controls" tab to test.
          <br>
          Then, check the console for errors.
        </p>

        <ProgressRoot
          v-model="errorCaseValue"
          class="relative flex items-center justify-center w-full h-8 overflow-hidden rounded-full bg-red-50"
          :max="errorCaseMax"
        >
          <ProgressIndicator
            class="w-full h-full bg-white"
            :style="`transform: translateX(${100 - errorCaseValue}%)`"
          />
          <div
            class="absolute font-mono text-xs font-bold text-center text-red-500 pointer-events-none"
          >
            <span class="opacity-60">Value:</span>
            <span class="tracking-widest">{{
              errorCaseValue || "undefined"
            }}</span>
            <br>
            <span class="opacity-60">Max:</span>
            <span class="tracking-widest">{{ errorCaseMax }}</span>
          </div>
        </ProgressRoot>

        <div class="flex justify-between mt-10">
          <h5 class="text-sm">
            Quick actions
          </h5>
          <button
            class="ml-2 text-sm underline"
            @click="
              errorCaseValue = 1;
              errorCaseMax = 100;
            "
          >
            Reset values
          </button>
        </div>
        <div class="flex flex-wrap gap-2 mt-3 text-sm">
          <button
            class="px-2 py-1 rounded-md text-slate-800 bg-slate-200 hover:bg-slate-300 h-max"
            @click="errorCaseValue = 1000"
          >
            Set <code class="text-green-600">value</code> to 1000
          </button>
          <button
            class="px-2 py-1 rounded-md text-slate-800 bg-slate-200 hover:bg-slate-300 h-max"
            @click="errorCaseValue = -1"
          >
            Set <code class="text-green-600">value</code> to -1
          </button>
          <button
            class="px-2 py-1 rounded-md text-slate-800 bg-slate-200 hover:bg-slate-300 h-max"
            @click="errorCaseMax = -1"
          >
            Set <code class="text-green-600">max</code> to -1
          </button>
        </div>
      </div>
    </Variant>
  </Story>
</template>
