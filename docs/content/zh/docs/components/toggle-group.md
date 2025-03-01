---

title: 切换按钮组
description: 一组可以打开或关闭的双状态按钮。
name: toggle-group
aria: https://www.w3.org/WAI/ARIA/apg/patterns/button
---

# 切换按钮组

<Description>
一组可以打开或关闭的双状态按钮。
</Description>

<ComponentPreview name="ToggleGroup" />

## 特性

<Highlights
  :features="[
    '全键盘导航',
    '支持水平/垂直方向',
    '支持单按和多按按钮',
    '可以是受控的或非受控的',
  ]"
/>

## 安装

从命令行安装组件。

<InstallationTabs value="reka-ui" />

## 组件解析

导入组件。

```vue
<script setup>
import { ToggleGroupItem, ToggleGroupRoot } from 'reka-ui'
</script>

<template>
  <ToggleGroupRoot>
    <ToggleGroupItem />
  </ToggleGroupRoot>
</template>
```

## API 参考

### Root

包含切换按钮组的所有部分。

<!-- @include: @/zh/meta/ToggleGroupRoot.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
  ]"
/>

### Item

组中的项。

<!-- @include: @/zh/meta/ToggleGroupItem.md -->

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
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
  ]"
/>

## 示例

### 确保始终有值

您可以受控组件以确保有值。

```vue line=5,10-13
<script setup>
import { ref } from 'vue'
import { ToggleGroupItem, ToggleGroupRoot } from 'reka-ui'

const value = ref('left')
</script>

<template>
  <ToggleGroupRoot
    :model-value="value"
    @update:model-value="(val) => {
      if (val) value = val
    }"
  >
    <ToggleGroupItem value="left">
      <TextAlignLeftIcon />
    </ToggleGroupItem>
    <ToggleGroupItem value="center">
      <TextAlignCenterIcon />
    </ToggleGroupItem>
    <ToggleGroupItem value="right">
      <TextAlignRightIcon />
    </ToggleGroupItem>
  </ToggleGroupRoot>
</template>
```

## 无障碍

使用[浮动 tabindex](https://www.w3.org/TR/wai-aria-practices-1.2/examples/radio/radio.html) 管理项之间的焦点移动。

### 键盘交互

<KeyboardTable
  :data="[
    {
      keys: ['Tab'],
      description:
        '将焦点移动到按下的项目或组中的第一项。',
    },
    {
      keys: ['Space'],
      description: '激活/停用项目。',
    },
    {
      keys: ['Enter'],
      description: '激活/停用项目。',
    },
    {
      keys: ['ArrowDown'],
      description: '将焦点移动到组中的下一项。',
    },
    {
      keys: ['ArrowRight'],
      description: '将焦点移动到组中的下一项。',
    },
    {
      keys: ['ArrowUp'],
      description: '将焦点移动到组中的上一项。',
    },
    {
      keys: ['ArrowLeft'],
      description: '将焦点移动到组中的上一项。',
    },
    {
      keys: ['Home'],
      description: '将焦点移至第一项。',
    },
    {
      keys: ['End'],
      description: '将焦点移至最后一项。',
    },
  ]"
/>
