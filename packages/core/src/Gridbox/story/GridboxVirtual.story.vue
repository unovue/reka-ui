<script setup lang="ts">
import { colorList } from '@/shared/constant'
import { GridboxCell, GridboxContent, GridboxRoot, GridboxRow, GridboxVirtualizer } from '..'
</script>

<template>
  <Story
    title="Gridbox/Virtual"
    :layout="{ type: 'grid', iframe: false, width: '50%' }"
  >
    <Variant title="Single Selection">
      <GridboxRoot
        class="w-96 h-80 mx-auto p-2 rounded-lg bg-neutral-100 border"
      >
        <GridboxContent class="h-full overflow-auto">
          <GridboxVirtualizer
            :options="colorList"
            :columns="3"
            :estimate-size="48"
          >
            <template #row>
              <GridboxRow class="grid gap-2 grid-cols-3 px-2 py-1" />
            </template>

            <template #cell="{ option }">
              <GridboxCell
                :value="option"
                :style="{ 'background-color': option }"
                class="h-10 rounded-md text-center flex items-center justify-center data-[highlighted]:ring-2 data-[highlighted]:ring-white data-[state=checked]:ring-2 data-[state=checked]:ring-red-500 relative cursor-pointer"
              >
                <span class="bg-white px-1 py-0.5 rounded text-xs text-black shadow-sm">
                  {{ option }}
                </span>
              </GridboxCell>
            </template>
          </GridboxVirtualizer>
        </GridboxContent>
      </GridboxRoot>
    </Variant>

    <Variant title="Multiple Selection">
      <GridboxRoot
        multiple
        class="w-96 h-80 mx-auto p-2 rounded-lg bg-neutral-100 border"
      >
        <GridboxContent class="h-full overflow-auto">
          <GridboxVirtualizer
            :options="colorList"
            :columns="3"
            :estimate-size="48"
          >
            <template #row>
              <GridboxRow class="grid gap-2 grid-cols-3 px-2 py-1" />
            </template>

            <template #cell="{ option }">
              <GridboxCell
                :value="option"
                :style="{ 'background-color': option }"
                class="h-10 rounded-md text-center flex items-center justify-center data-[highlighted]:ring-2 data-[highlighted]:ring-white data-[state=checked]:ring-2 data-[state=checked]:ring-red-500 relative cursor-pointer"
              >
                <span class="bg-white px-1 py-0.5 rounded text-xs text-black shadow-sm">
                  {{ option }}
                </span>
              </GridboxCell>
            </template>
          </GridboxVirtualizer>
        </GridboxContent>
      </GridboxRoot>
    </Variant>

    <Variant title="Replace Behavior (Single)">
      <GridboxRoot
        selection-behavior="replace"
        class="w-96 h-80 mx-auto p-2 rounded-lg bg-neutral-100 border"
      >
        <GridboxContent class="h-full overflow-auto">
          <GridboxVirtualizer
            :options="colorList"
            :columns="3"
            :estimate-size="48"
          >
            <template #row>
              <GridboxRow class="grid gap-2 grid-cols-3 px-2 py-1" />
            </template>

            <template #cell="{ option }">
              <GridboxCell
                :value="option"
                :style="{ 'background-color': option }"
                class="h-10 rounded-md text-center flex items-center justify-center data-[highlighted]:ring-2 data-[highlighted]:ring-white data-[state=checked]:ring-2 data-[state=checked]:ring-red-500 relative cursor-pointer"
              >
                <span class="bg-white px-1 py-0.5 rounded text-xs text-black shadow-sm">
                  {{ option }}
                </span>
              </GridboxCell>
            </template>
          </GridboxVirtualizer>
        </GridboxContent>
      </GridboxRoot>
    </Variant>

    <Variant title="Replace Behavior (Multiple)">
      <GridboxRoot
        multiple
        selection-behavior="replace"
        class="w-96 h-80 mx-auto p-2 rounded-lg bg-neutral-100 border"
      >
        <GridboxContent class="h-full overflow-auto">
          <GridboxVirtualizer
            :options="colorList"
            :columns="3"
            :estimate-size="48"
          >
            <template #row>
              <GridboxRow class="grid gap-2 grid-cols-3 px-2 py-1" />
            </template>

            <template #cell="{ option }">
              <GridboxCell
                :value="option"
                :style="{ 'background-color': option }"
                class="h-10 rounded-md text-center flex items-center justify-center data-[highlighted]:ring-2 data-[highlighted]:ring-white data-[state=checked]:ring-2 data-[state=checked]:ring-red-500 relative cursor-pointer"
              >
                <span class="bg-white px-1 py-0.5 rounded text-xs text-black shadow-sm">
                  {{ option }}
                </span>
              </GridboxCell>
            </template>
          </GridboxVirtualizer>
        </GridboxContent>
      </GridboxRoot>
    </Variant>
  </Story>
</template>
