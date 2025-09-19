<script setup lang="ts">
import { ref } from 'vue'
import { MenuItem, MenuSeparator } from '..'
import MenuWithAnchor from './_MenuWithAnchor.vue'
import Submenu from './_Submenu.vue'

function handleSelect(text: string) {
  // eslint-disable-next-line no-console
  console.log({ text })
}

const open1 = ref(false)
const open2 = ref(false)
</script>

<template>
  <Story
    group="utilities"
    title="Menu/SubMenu"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="default">
      <div class="text-black">
        <span>{{ open1 }}</span>
        <span>{{ open2 }}</span>
      </div>
      <MenuWithAnchor>
        <MenuItem
          class="flex items-center justify-between leading-[1] cursor-default select-none whitespace-nowrap h-[25px] px-[10px] text-black rounded-[3px] outline-none data-[highlighted]:bg-black data-[highlighted]:text-white data-[disabled]:text-gray-100"
          @select="handleSelect('undo')"
        >
          Undo
        </MenuItem>

        <Submenu
          v-model:open="open1"
          :disabled="true"
        >
          <MenuItem
            class="flex items-center justify-between leading-[1] cursor-default select-none whitespace-nowrap h-[25px] px-[10px] text-black rounded-[3px] outline-none data-[highlighted]:bg-black data-[highlighted]:text-white data-[disabled]:text-gray-100"
            disabled
          >
            Disabled
          </MenuItem>
          <MenuItem
            class="flex items-center justify-between leading-[1] cursor-default select-none whitespace-nowrap h-[25px] px-[10px] text-black rounded-[3px] outline-none data-[highlighted]:bg-black data-[highlighted]:text-white data-[disabled]:text-gray-100"
            @select="handleSelect('one')"
          >
            One
          </MenuItem>
          <MenuItem
            class="flex items-center justify-between leading-[1] cursor-default select-none whitespace-nowrap h-[25px] px-[10px] text-black rounded-[3px] outline-none data-[highlighted]:bg-black data-[highlighted]:text-white data-[disabled]:text-gray-100"
            @select="handleSelect('Two')"
          >
            Two
          </MenuItem>

          <Submenu v-model:open="open2">
            <MenuItem
              class="flex items-center justify-between leading-[1] cursor-default select-none whitespace-nowrap h-[25px] px-[10px] text-black rounded-[3px] outline-none data-[highlighted]:bg-black data-[highlighted]:text-white data-[disabled]:text-gray-100"
              @select="handleSelect('one')"
            >
              One
            </MenuItem>
            <MenuItem
              class="flex items-center justify-between leading-[1] cursor-default select-none whitespace-nowrap h-[25px] px-[10px] text-black rounded-[3px] outline-none data-[highlighted]:bg-black data-[highlighted]:text-white data-[disabled]:text-gray-100"
              @select="handleSelect('Two')"
            >
              Two
            </MenuItem>
            <MenuItem
              class="flex items-center justify-between leading-[1] cursor-default select-none whitespace-nowrap h-[25px] px-[10px] text-black rounded-[3px] outline-none data-[highlighted]:bg-black data-[highlighted]:text-white data-[disabled]:text-gray-100"
              @select="handleSelect('Three')"
            >
              Three
            </MenuItem>
            <MenuItem
              class="flex items-center justify-between leading-[1] cursor-default select-none whitespace-nowrap h-[25px] px-[10px] text-black rounded-[3px] outline-none data-[highlighted]:bg-black data-[highlighted]:text-white data-[disabled]:text-gray-100"
              @select="handleSelect('Four')"
            >
              Four
            </MenuItem>
          </Submenu>
        </Submenu>

        <MenuItem
          class="flex items-center justify-between leading-[1] cursor-default select-none whitespace-nowrap h-[25px] px-[10px] text-black rounded-[3px] outline-none data-[highlighted]:text-white data-[highlighted]:bg-black data-[disabled]:text-gray-100"
          @select="handleSelect('cut')"
        >
          Cut
        </MenuItem>

        <MenuSeparator class="h-[1px] my-[5px] mx-[10px] bg-gray-200" />

        <MenuItem
          class="flex items-center justify-between leading-[1] cursor-default select-none whitespace-nowrap h-[25px] px-[10px] text-black rounded-[3px] outline-none data-[highlighted]:text-white data-[highlighted]:bg-black data-[disabled]:text-gray-100"
          :disabled="true"
          @select="handleSelect('copy')"
        >
          Copy
        </MenuItem>
        <MenuItem
          class="flex items-center justify-between leading-[1] cursor-default select-none whitespace-nowrap h-[25px] px-[10px] text-black rounded-[3px] outline-none data-[highlighted]:text-white data-[highlighted]:bg-black data-[disabled]:text-gray-100"
          @select="handleSelect('paste')"
        >
          Paste
        </MenuItem>
      </MenuWithAnchor>
    </Variant>
  </Story>
</template>
