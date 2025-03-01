---

title: 滚动区域
description: 自定义跨浏览器滚动样式，增强原生滚动功能。
name: scroll-area
---

# 滚动区域

<Description>
自定义跨浏览器滚动样式，增强原生滚动功能。
</Description>

<ComponentPreview name="ScrollArea" />

## 特性

<Highlights
  :features="[
    '滚动条位于可滚动内容的顶部，不占用任何空间',
    '滚动是原生的；没有通过 CSS 转换进行的基础位置移动。',
    '仅在与控件交互时填充指针行为，因此键盘控件不受影响。',
    '支持从右到左的方向（RTL）',
  ]"
/>

## 安装

从命令行安装组件。

<InstallationTabs value="reka-ui" />

## 组件解析

导入所有零件并将它们拼凑在一起。

```vue
<script setup>
import { ScrollAreaRoot, ScrollAreaScrollbar, ScrollAreaThumb, ScrollAreaViewport } from 'reka-ui'
</script>

<template>
  <ScrollAreaRoot>
    <ScrollAreaViewport />
    <ScrollAreaScrollbar orientation="horizontal">
      <ScrollAreaThumb />
    </ScrollAreaScrollbar>
    <ScrollAreaScrollbar orientation="vertical">
      <ScrollAreaThumb />
    </ScrollAreaScrollbar>
    <ScrollAreaCorner />
  </ScrollAreaRoot>
</template>
```

## API 参考

### Root

包含滚动区域的所有部件。

<!-- @include: @/zh/meta/ScrollAreaRoot.md -->

### Viewport

滚动区域的视口区域。

<!-- @include: @/zh/meta/ScrollAreaViewport.md -->

### Scrollbar

垂直滚动条。添加第二个带有 `orientation` 属性的 `Scrollbar` 以启用水平滚动。

<PresenceCallout />

<!-- @include: @/zh/meta/ScrollAreaScrollbar.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['visible', 'hidden'],
    },
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
  ]"
/>

### Thumb

要在 `ScrollAreaScrollbar` 中使用的滑钮。

<!-- @include: @/zh/meta/ScrollAreaThumb.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['visible', 'hidden'],
    },
  ]"
/>

### Corner

垂直滚动条和水平滚动条相交的角。

<!-- @include: @/zh/meta/ScrollAreaCorner.md -->

## 无障碍

在大多数情况下，最好依赖原生滚动并使用 CSS 中提供的自定义选项。如果这还不够，`ScrollArea` 会提供额外的可自定义性，同时保持浏览器的本机滚动行为（以及辅助功能，如键盘滚动）。

### 键盘交互

默认情况下支持通过键盘滚动，因为该组件依赖于原生滚动。特定的键盘交互可能因平台而异，因此我们不在此处指定它们，也不添加特定的事件侦听器来处理通过按键事件进行的滚动。
