---
title: 步骤
description: 一组步骤，用于指示多步骤流程的进度。
name: stepper
---

# 步骤

<Description>
一组步骤，用于指示多步骤流程的进度。
</Description>

<ComponentPreview name="Stepper" />

## 特性

<Highlights
  :features="[
    '可以是受控的或非受控的',
    '支持水平/垂直方向',
    '支持线性/非线性激活',
    '全键盘导航',
  ]"
/>

## 安装

从命令行安装组件。

<InstallationTabs value="reka-ui" />

## 组件解析

导入所有零件并将它们拼凑在一起。

```vue
<script setup>
import { StepperDescription, StepperIndicator, StepperItem, StepperRoot, StepperTitle, StepperTrigger } from 'reka-ui'
</script>

<template>
  <StepperRoot>
    <StepperItem>
      <StepperTrigger />
      <StepperIndicator />

      <StepperTitle />
      <StepperDescription />

      <StepperSeparator />
    </StepperItem>
  </StepperRoot>
</template>
```

## API 参考

### Root

包含所有步进组件的部件。

<!-- @include: @/zh/meta/StepperRoot.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
    {
      attribute: '[data-linear]',
      values: 'Present when linear'
    },
  ]"
/>

### Item

步骤项组件。

<!-- @include: @/zh/meta/StepperItem.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['active', 'inactive', 'completed'],
    },
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    },
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
  ]"
/>

### Trigger

用于切换步骤的触发器。

<!-- @include: @/zh/meta/StepperTrigger.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['active', 'inactive', 'completed'],
    },
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    },
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
  ]"
/>

### Indicator

步骤的指示器。

<!-- @include: @/zh/meta/StepperIndicator.md -->

### Title

在步进器触发器聚焦时宣布的辅助标题。

如果您想隐藏标题，请将其包装在我们的视觉隐藏实用组件，如 `<VisuallyHidden asChild>`。

<!-- @include: @/zh/meta/StepperTitle.md -->

### Description

当步进触发器聚焦时宣布的可选可访问描述。

如果你想隐藏描述，请将其包装在我们的 `VisuallyHidden` 实用组件，像这样 `<VisuallyHidden asChild>`。如果要完全删除描述，请删除此部分并将 `aria-describedby="undefined"` 传递给 `StepperTrigger`。

<!-- @include: @/zh/meta/StepperItem.md -->

## 示例

### 垂直

你可以使用 `orientation` 属性创建垂直步长。

```vue line=8
<script setup>
import { StepperDescription, StepperIndicator, StepperItem, StepperList, StepperRoot, StepperTitle } from 'reka-ui'
</script>

<template>
  <StepperRoot
    :default-value="1"
    orientation="vertical"
  >
    <StepperList aria-label="stepper example">
      <StepperItem>
        <StepperIndicator />
        <StepperTitle />
        <StepperDescription />
      </StepperItem>
      <StepperItem>
        <StepperIndicator />
        <StepperTitle />
        <StepperDescription />
      </StepperItem>
    </StepperList>
  </StepperRoot>
</template>
```

## 无障碍

### 键盘交互

<KeyboardTable
  :data="[
    {
      keys: ['Tab'],
      description: '<span>当焦点移动到步骤上时，将焦点放在第一步。</span>',
    },
    {
      keys: ['ArrowDown'],
      description: '<span>根据<Code>orientation</Code>将焦点移至下一步。</span>',
    },
    {
      keys: ['ArrowRight'],
      description: '<span>根据<Code>orientation</Code>将焦点移至下一步。</span>',
    },
    {
      keys: ['ArrowUp'],
      description: '<span>根据<Code>orientation</Code>将焦点移至上一步。</span>',
    },
    {
      keys: ['ArrowLeft'],
      description: '<span>根据<Code>orientation</Code>将焦点移至上一步。</span>',
    },
    {
    keys: ['Enter', 'Space'],
    description: '<span>选择聚焦的步骤。</span>',
    },
  ]"
/>
