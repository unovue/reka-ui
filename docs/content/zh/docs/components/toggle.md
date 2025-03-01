---

title: 切换按钮
description: 一个可以打开或关闭的双状态按钮。
name: toggle
aria: https://www.w3.org/WAI/ARIA/apg/patterns/button
---

# 切换按钮

<Description>
一个可以打开或关闭的双状态按钮。
</Description>

<ComponentPreview name="Toggle" />

## 特性

<Highlights
  :features="['全键盘导航', '可以是受控的或非受控的']"
/>

## 安装

从命令行安装组件。

<InstallationTabs value="reka-ui" />

## 组件解析

导入组件。

```vue
<script setup>
import { Toggle } from 'reka-ui'
</script>

<template>
  <Toggle />
</template>
```

## API 参考

### Root

切换按钮。

<!-- @include: @/zh/meta/Toggle.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['on', 'off'],
    },
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    },
  ]"
/>

## 无障碍

### 键盘交互

<KeyboardTable
  :data="[
    {
      keys: ['Space'],
      description: '激活/停用切换。',
    },
    {
      keys: ['Enter'],
      description: '激活/停用切换。',
    },
  ]"
/>
