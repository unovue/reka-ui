---

title: 进度
description: 显示一个指示器，展示任务的完成进度，通常显示为进度条。
name: progress
aria: https://www.w3.org/WAI/ARIA/apg/patterns/meter
---

# 进度

<Description>
显示一个指示器，展示任务的完成进度，通常显示为进度条。
</Description>

<ComponentPreview name="Progress" />

## 特性

<Highlights
  :features="[
    '为辅助技术提供上下文以读取任务的进度',
  ]"
/>

## 安装

从命令行安装组件。

<InstallationTabs value="reka-ui" />

### 组件解析

导入所有零件并将它们拼凑在一起。

```vue
<script setup>
import { ProgressIndicator, ProgressRoot } from 'reka-ui'
</script>

<template>
  <ProgressRoot>
    <ProgressIndicator />
  </ProgressRoot>
</template>
```

## 无障碍

遵循 [progressbar 角色要求](https://www.w3.org/WAI/ARIA/apg/patterns/meter)。

## API 参考

### Root

包含所有进度部件。

<!-- @include: @/zh/meta/ProgressRoot.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['complete', 'indeterminate', 'loading'],
    },
    {
      attribute: '[data-value]',
      values: 'The 当前值',
    },
    {
      attribute: '[data-max]',
      values: 'The max value',
    },
  ]"
/>

### Indicator

用于直观地显示进度。它还使辅助技术能够取得进度值。

<!-- @include: @/zh/meta/ProgressIndicator.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['complete', 'indeterminate', 'loading'],
    },
    {
      attribute: '[data-value]',
      values: 'The 当前值',
    },
    {
      attribute: '[data-max]',
      values: 'The max value',
    },
  ]"
/>
