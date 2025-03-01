---

title: 开关
description: 允许用户在开和关之间切换的控件。
name: switch
aria: https://www.w3.org/WAI/ARIA/apg/patterns/switch
---

# 开关

<Description>
允许用户在开和关之间切换的控件。
</Description>

<ComponentPreview name="Switch" />

## 特性

<Highlights
  :features="['全键盘导航', '可以是受控的或非受控的']"
/>

## 安装

从命令行安装组件。

<InstallationTabs value="reka-ui" />

## 组件解析

导入所有零件并将它们拼凑在一起。

```vue
<script setup>
import { SwitchRoot, SwitchThumb } from 'reka-ui'
</script>

<template>
  <SwitchRoot>
    <SwitchThumb />
  </SwitchRoot>
</template>
```

## API 参考

### Root

包含开关的所有部分。在 `form` 中使用时，`input` 也会渲染，以确保事件正确传播。

<!-- @include: @/zh/meta/SwitchRoot.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['checked', 'unchecked'],
    },
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    },
  ]"
/>

### Thumb

用于视觉上指示开关是打开还是关闭的滑钮。

<!-- @include: @/zh/meta/SwitchThumb.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['checked', 'unchecked'],
    },
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    },
  ]"
/>

## 无障碍

遵循 [`switch` 角色要求](https://www.w3.org/WAI/ARIA/apg/patterns/switch)。

### 键盘交互

<KeyboardTable
  :data="[
    {
      keys: ['Space'],
      description: '切换组件的状态。',
    },
    {
      keys: ['Enter'],
      description: '切换组件的状态。',
    },
  ]"
/>
