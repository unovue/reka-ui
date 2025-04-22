<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { CheckboxIndicator, CheckboxRoot } from 'reka-ui'
import { ref } from 'vue'
import './styles.css'

const checkboxOne = ref(true)
</script>

<template>
  <div :style="{ display: 'flex', alignItems: 'center' }">
    <label>
      <CheckboxRoot
        v-model="checkboxOne"
        class="CheckboxRoot"
      >
        <CheckboxIndicator class="CheckboxIndicator">
          <Icon icon="radix-icons:check" />
        </CheckboxIndicator>
      </CheckboxRoot>
      <span class="Label">Accept terms and conditions.</span>
    </label>
  </div>
</template>
