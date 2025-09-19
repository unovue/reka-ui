<script setup lang="ts">
import { reactive, ref } from 'vue'
import { FocusScope } from '@/FocusScope'
import { DismissableLayer } from '..'
import DismissableBox from './_DismissableBox.vue'

const open = ref(false)

function handleClick() {
  // eslint-disable-next-line no-console
  console.log('click')
}

const state = reactive({
  isEscapeKeyDownPrevented: false,
  isPointerDownOutsidePrevented: false,
  isFocusOutsidePrevented: false,
})

const openWithFocusScope = ref(false)
const openButtonRef = ref<HTMLElement>()
</script>

<template>
  <Story
    group="utilities"
    title="DismissableLayer/Basic"
    :layout="{ type: 'grid', width: '50%' }"
  >
    <Variant title="default">
      <template #controls>
        <HstCheckbox
          v-model="state.isEscapeKeyDownPrevented"
          title="Dismiss on escape?"
        />
        <HstCheckbox
          v-model="state.isPointerDownOutsidePrevented"
          title="Dismiss on pointer down outside?"
        />
        <HstCheckbox
          v-model="state.isFocusOutsidePrevented"
          title="Dismiss on focus outside?"
        />
      </template>

      <div class="flex flex-col">
        <button @click="open = !open">
          open
        </button>

        <DismissableLayer
          v-if="open"
          :style="{
            display: 'inline-flex',
            justifyContent: 'center',
            alignItems: 'center',
            verticalAlign: 'middle',
            width: 400,
            height: 300,
            backgroundColor: 'black',
            borderRadius: 10,
            marginBottom: 20,
          }"
          @dismiss="open = false"
          @escape-key-down="
            (ev) => {
              if (state.isEscapeKeyDownPrevented) ev.preventDefault();
            }
          "
          @pointer-down-outside="
            (ev) => {
              if (state.isPointerDownOutsidePrevented) ev.preventDefault();
            }
          "
          @focus-outside="
            (ev) => {
              if (state.isFocusOutsidePrevented) ev.preventDefault();
            }
          "
        >
          <div class="p-4 bg-gray-400">
            <input type="text">
          </div>
        </DismissableLayer>

        <button @click="handleClick">
          Hey heeey!
        </button>
      </div>
    </Variant>

    <Variant title="Nested">
      <DismissableBox />
    </Variant>

    <Variant title="Focus trap">
      <div class="flex flex-col justify-center">
        <button
          ref="openButtonRef"
          @click="openWithFocusScope = !openWithFocusScope"
        >
          open
        </button>

        <DismissableLayer
          v-if="openWithFocusScope"
          as-child
          disable-outside-pointer-events
          @dismiss="openWithFocusScope = false"
          @pointer-down-outside="
            (ev) => {
              if (ev.target === openButtonRef) ev.preventDefault();
            }
          "
        >
          <FocusScope
            trapped
            loop
            class="w-[400px] h-[300px] bg-black rounded flex flex-col items-center justify-center"
          >
            <input type="text">
            <input type="text">
            <input type="text">
          </FocusScope>
        </DismissableLayer>
      </div>
    </Variant>
  </Story>
</template>
