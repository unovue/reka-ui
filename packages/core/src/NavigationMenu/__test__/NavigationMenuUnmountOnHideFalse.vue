<script setup lang="ts">
import { ref } from 'vue'
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuRoot,
  NavigationMenuTrigger,
} from '..'

const modelValue = ref('')
</script>

<template>
  <NavigationMenuRoot
    v-model="modelValue"
    :unmount-on-hide="false"
    :disable-hover-trigger="true"
  >
    <span data-testid="model-value">{{ modelValue }}</span>
    <NavigationMenuList>
      <NavigationMenuItem value="one">
        <NavigationMenuTrigger data-testid="trigger-one">
          One
        </NavigationMenuTrigger>
        <NavigationMenuContent data-testid="content-one">
          <button data-testid="inside-one">
            Inside one
          </button>
        </NavigationMenuContent>
      </NavigationMenuItem>

      <NavigationMenuItem value="two">
        <NavigationMenuTrigger data-testid="trigger-two">
          Two
        </NavigationMenuTrigger>
        <NavigationMenuContent data-testid="content-two">
          <button data-testid="inside-two">
            Inside two
          </button>
        </NavigationMenuContent>
      </NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenuRoot>
</template>
