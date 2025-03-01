---

title: 复选框
description: 一个允许用户在选中和未选中状态之间切换的控件。
name: checkbox
aria: https://www.w3.org/WAI/ARIA/apg/patterns/checkbox
---

# 复选框

<Description>
一个允许用户在选中和未选中状态之间切换的控件。
</Description>

<ComponentPreview name="Checkbox" />

## 特性

<Highlights
  :features="[
    '支持不确定状态',
    '全键盘导航',
    '可以是受控的或非受控的',
  ]"
/>

## 安装

从命令行安装组件。

<InstallationTabs value="reka-ui" />

## 组件解析

导入所有零件并将它们拼凑在一起。

```vue
<script setup>
import { CheckboxGroupRoot, CheckboxIndicator, CheckboxRoot } from 'reka-ui'
</script>

<template>
  <CheckboxRoot>
    <CheckboxIndicator />
  </CheckboxRoot>

  <!-- or with array support -->
  <CheckboxGroupRoot>
    <CheckboxRoot>
      <CheckboxIndicator />
    </CheckboxRoot>
  </CheckboxGroupRoot>
</template>
```

## API 参考

### Root

包含复选框的所有部分。当在 `form` 内使用时，`input` 也将呈现，以确保事件正确传播。

<!-- @include: @/zh/meta/CheckboxRoot.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['checked', 'unchecked', 'indeterminate'],
    },
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    },
  ]"
/>

### Indicator

当复选框处于选中或不确定状态时呈现。你可以直接设置此元素的样式，也可以将其用作包装器来放入一个图标，或者两者兼而有之。

<PresenceCallout />

<!-- @include: @/zh/meta/CheckboxIndicator.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['checked', 'unchecked', 'indeterminate'],
    },
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    },
  ]"
/>

### CheckboxGroupRoot

围绕 `CheckboxRoot` 的包装器，以支持 `modelValue` 数组。

<!-- @include: @/zh/meta/CheckboxGroupRoot.md -->

## 示例

### 不确定状态

你可以通过控制其状态将复选框设置为 `indeterminate` 状态。

```vue line=5,9-14,16-18
<script setup>
import { Icon } from '@iconify/vue'
import { CheckboxIndicator, CheckboxRoot } from 'reka-ui'

const checked = ref('indeterminate')
</script>

<template>
  <CheckboxRoot v-model="checked">
    <CheckboxIndicator>
      <Icon
        v-if="checked === 'indeterminate'"
        icon="radix-icons:divider-horizontal"
      />
      <Icon
        v-if="checked"
        icon="radix-icons:check"
      />
    </CheckboxIndicator>
  </CheckboxRoot>

  <button
    type="button"
    @click="() => (checked === 'indeterminate' ? (checked = false) : (checked = 'indeterminate'))"
  >
    Toggle indeterminate
  </button>
</template>
```

## 无障碍

遵循[三态复选框 WAI-ARIA 设计模式](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox)。

### 键盘交互

<KeyboardTable
  :data="[
    {
      keys: ['Space'],
      description: '选中/取消选中复选框',
    },
  ]"
/>
