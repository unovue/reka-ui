<script setup lang="ts">
import { type VNode, capitalize, computed, ref, useSlots, watch } from 'vue'
import { SelectContent, SelectItem, SelectItemIndicator, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport, TabsContent, TabsList, TabsRoot, TabsTrigger } from 'reka-ui'
import { Icon } from '@iconify/vue'
import { useVModel } from '@vueuse/core'

defineOptions({
  inheritAttrs: false,
})
const props = defineProps<{
  modelValue: 'css' | 'tailwind' | 'pinceau'
  type?: 'demo' | 'example'

}>()
const emits = defineEmits<{
  'update:modelValue': [payload: 'css' | 'tailwind' | 'pinceau']
}>()
const cssFramework = useVModel(props, 'modelValue', emits)

const slots = useSlots()
const slotsFramework = computed(() => slots.default?.().map(slot => slot.props?.key?.toString()?.replace('_', '')) ?? [])

const cssFrameworkOptions = computed(() => [
  { label: 'Tailwind', value: 'tailwind', icon: 'devicon:tailwindcss' },
  { label: 'CSS', value: 'css', icon: 'devicon:css3' },
  { label: 'Pinceau', value: 'pinceau' },
].filter(i => slotsFramework.value.includes(i.value)))

const tabs = computed(
  () => {
    const currentFramework = slots.default?.().find(slot => slot.props?.key?.toString().includes(cssFramework.value))
    const childSlots = (currentFramework?.children as VNode[]).sort((a, b) => a?.props?.name?.localeCompare(b?.props?.name))
    return childSlots?.map((slot, index) => {
      return {
        label: slot.props?.name || `${index}`,
        component: slot,
      }
    }) || []
  },
)

const open = ref(false)

const codeScrollWrapper = ref<HTMLElement | undefined>()
const currentTab = ref('index.vue')

watch(open, () => {
  if (!open.value) {
    codeScrollWrapper.value!.scrollTo({
      top: 0,
    })
  }
})
</script>

<template>
  <TabsRoot
    v-model="currentTab"
    class="bg-[hsl(141_17%_5%)] border border-[hsl(0_0%_15%)] rounded-xl overflow-hidden"
    :unmount-on-hide="false"
    @update:model-value="open = true"
  >
    <div class="bg-[hsl(141_17%_5%)]  border-b-2 border-[hsl(0_0%_15%)] flex pr-2">
      <div class="flex justify-between items-center w-full text-[13px]">
        <TabsList class="flex">
          <TabsTrigger
            v-for="(tab, index) in tabs"
            :key="index"
            :value="tab.label"
            tabindex="-1"
            class="text-white/70 py-2.5 px-4 border-box data-[state=active]:shadow-[0_1px_0_#10b981] data-[state=active]:font-medium data-[state=active]:text-white"
          >
            {{ tab.label }}
          </TabsTrigger>
        </TabsList>
        <div v-if="type === 'demo'">
          <SelectRoot
            v-model="cssFramework"
            @update:model-value="currentTab = 'index.vue'"
          >
            <SelectTrigger
              class="flex items-center justify-between text-white hover:bg-code rounded w-32 text-xs py-1.5 px-2 disabled:opacity-50"
              aria-label="Select CSS framework"
            >
              <div class="inline-flex items-center gap-2">
                <Icon
                  :icon="cssFrameworkOptions.find(opt => opt.value === cssFramework)?.icon ?? ''"
                  class="text-base"
                />

                <SelectValue>
                  {{ cssFrameworkOptions.find(opt => opt.value === cssFramework)?.label }}
                </SelectValue>
              </div>

              <Icon
                icon="lucide:chevron-down"
                class="h-3.5 w-3.5"
              />
            </SelectTrigger>

            <SelectPortal>
              <SelectContent class="border border-stone-700 min-w-32 bg-code rounded-md shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] will-change-[opacity,transform] data-[side=top]:animate-slideDownAndFade data-[side=right]:animate-slideLeftAndFade data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade z-[100]">
                <SelectViewport class="p-[5px]">
                  <SelectItem
                    v-for="framework in cssFrameworkOptions"
                    :key="framework.label"
                    class="text-xs leading-none rounded-[3px] text-white flex items-center h-[25px] pl-[25px] relative select-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:outline-none data-[highlighted]:bg-primary/10 data-[highlighted]:text-primary data-[state=checked]:text-primary"
                    :value="framework.value"
                  >
                    <SelectItemIndicator class="absolute left-0 w-[25px] inline-flex items-center justify-center">
                      <Icon icon="lucide:check" />
                    </SelectItemIndicator>

                    <SelectItemText>
                      {{ capitalize(framework.label ?? '') }}
                    </SelectItemText>
                  </SelectItem>
                </SelectViewport>
              </SelectContent>
            </SelectPortal>
          </SelectRoot>
        </div>
      </div>
    </div>
    <div
      ref="codeScrollWrapper"
      :key="cssFramework"
      class="overflow-auto max-h-[50vh]"
    >
      <TabsContent
        v-for="tab in tabs"
        :key="tab.label"
        :value="tab.label"
        as-child
      >
        <div class="relative text-base">
          <component
            :is="tab.component"
            class="border-0 !mb-0"
          />
        </div>
      </TabsContent>
    </div>
  </TabsRoot>
</template>
