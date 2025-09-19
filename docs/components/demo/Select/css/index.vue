<script setup lang="ts">
import { Icon } from '@iconify/vue'
import {
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectLabel,
  SelectPortal,
  SelectRoot,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from 'reka-ui'
import { ref } from 'vue'
import './styles.css'

const fruit = ref()

const options = ['Apple', 'Banana', 'Blueberry', 'Grapes', 'Pineapple']
const vegetables = ['Aubergine', 'Broccoli', 'Carrot', 'Courgette', 'Leek']
</script>

<template>
  <SelectRoot v-model="fruit">
    <SelectTrigger
      class="SelectTrigger"
      aria-label="Customise options"
    >
      <SelectValue placeholder="Select a fruit..." />
      <Icon icon="radix-icons:chevron-down" />
    </SelectTrigger>

    <SelectPortal>
      <SelectContent
        class="SelectContent"
        :side-offset="5"
      >
        <SelectScrollUpButton class="SelectScrollButton">
          <Icon icon="radix-icons:chevron-up" />
        </SelectScrollUpButton>

        <SelectViewport class="SelectViewport">
          <SelectLabel class="SelectLabel">
            Fruits
          </SelectLabel>
          <SelectGroup>
            <SelectItem
              v-for="(option, index) in options"
              :key="index"
              class="SelectItem"
              :value="option"
            >
              <SelectItemIndicator class="SelectItemIndicator">
                <Icon icon="radix-icons:check" />
              </SelectItemIndicator>
              <SelectItemText>
                {{ option }}
              </SelectItemText>
            </SelectItem>
          </SelectGroup>
          <SelectSeparator class="SelectSeparator" />
          <SelectLabel class="SelectLabel">
            Vegetables
          </SelectLabel>
          <SelectGroup>
            <SelectItem
              v-for="(option, index) in vegetables"
              :key="index"
              class="SelectItem"
              :value="option"
              :disabled="option === 'Courgette'"
            >
              <SelectItemIndicator class="SelectItemIndicator">
                <Icon icon="radix-icons:check" />
              </SelectItemIndicator>
              <SelectItemText>
                {{ option }}
              </SelectItemText>
            </SelectItem>
          </SelectGroup>
        </SelectViewport>

        <SelectScrollDownButton class="SelectScrollButton">
          <Icon icon="radix-icons:chevron-down" />
        </SelectScrollDownButton>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
