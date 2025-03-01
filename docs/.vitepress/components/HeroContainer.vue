<script setup lang="ts">
import { ref, watch } from 'vue'
import { Label, SwitchRoot, SwitchThumb } from 'reka-ui'
import CodeSandbox from '../../components/CodeSandbox.vue'
import Stackblitz from '../../components/Stackblitz.vue'

const props = withDefaults(
  defineProps<{
    overflow?: boolean
    folder?: string
    files?: string[]
    cssFramework?: string
    type?: 'demo' | 'example'
  }>(),
  { folder: '', files: () => [] },
)

const isCodeView = ref(false)
const sources = ref<Record<string, string>>({})

watch(() => props.cssFramework, () => {
  sources.value = {} // reset sources everytime the value changes
  props.files?.forEach((file) => {
    const [folder, fileName] = file.split('/')
    const extension = file.split('.').pop()

    if (props.type === 'demo') {
      import(`../../components/demo/${props.folder}/${folder}/${fileName.replace(`.${extension}`, '')}.${extension}?raw`).then(
        res => (sources.value[fileName] = res.default),
      )
    }
    else {
      import(`../../components/examples/${props.folder}/${file.replace(`.${extension}`, '')}.${extension}?raw`).then(
        res => (sources.value[file] = res.default),
      )
    }
  })
}, { immediate: true })
</script>

<template>
  <div
    class="relative text-sm text-black"
    :class="{ 'my-4': type === 'example' }"
  >
    <div class="w-full flex justify-end">
      <div class="flex items-center mb-4 text-foreground">
        <Label
          for="view-code"
          class="font-medium text-sm"
        >
          {{ $t('view-code') }}
        </Label>
        <SwitchRoot
          id="view-code"
          v-model="isCodeView"
          class="w-[34px] h-5 ml-2 flex data-[state=unchecked]:bg-primary/50 data-[state=checked]:bg-primary rounded-full relative transition"
          :aria-label="$t('view-code')"
        >
          <SwitchThumb
            class="w-4 h-4 my-auto bg-white text-xs flex items-center justify-center shadow-xl rounded-full transition-transform translate-x-0.5 will-change-transform data-[state=checked]:translate-x-full"
          />
        </SwitchRoot>
      </div>
    </div>

    <div
      v-if="!isCodeView"
      class="not-prose p-4 rounded-xl bg-card backdrop-blur-2xl w-full relative items-center justify-center flex border border-muted min-h-[400px]"
      :class="{ 'overflow-x-auto': overflow }"
    >
      <div class="w-full max-w-[700px] flex items-center py-12 sm:py-[100px] custom-justify-center ">
        <slot />

        <Stackblitz
          v-if="folder"
          class="hidden sm:block absolute bottom-4 right-12"
          :name="folder"
          :files="files"
          :sources="sources"
        />
        <CodeSandbox
          v-if="folder"
          class="hidden sm:block absolute bottom-4 right-4"
          :name="folder"
          :files="files"
          :sources="sources"
        />
      </div>
    </div>

    <div v-else>
      <slot name="codeSlot" />
    </div>
  </div>
</template>

<style scoped>
:deep(li) {
  margin-top: 0 !important;
}

:deep(h3) {
  margin: 0px !important;
  font-weight: unset !important;
}

:deep(pre) {
  z-index: 0 !important;
}
</style>
