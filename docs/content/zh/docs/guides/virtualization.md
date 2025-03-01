---
title: 虚拟化
description: 了解如何使用由 `@tanstack/virtual` 提供支持的 Reka UI 高效渲染大型数据集。
---

# 虚拟化

<Description>

了解如何使用由 `@tanstack/virtual` 提供支持的 Reka UI 高效渲染大型数据集。

</Description>

<Callout type="info" title="什么是虚拟化？">

虚拟化是一种技术，用于通过仅呈现视区中当前可见的项目来有效地呈现大型列表或树结构。这种方法可以显著提高性能并减少内存使用量，尤其是在处理数千个项目时。

</Callout>

## 使用虚拟化的好处

<Highlights
  :features="[
    '改进性能：无延迟地渲染数千个项目',
    '减少内存使用量：仅为可见项目挂载 DOM 节点',
    '更好的用户体验： 快速的初始加载时间和响应式交互',
  ]"
/>

## 自定义选项

All virtualizer () components offer the following props and customization:
所有虚拟化器（[Combobox](/zh/docs/components/combobox#virtualizer)、[Listbox](/zh/docs/components/listbox#virtualizer)，和[Tree](/zh/docs/components/tree#virtualizer)）组件都提供以下 prop 和自定义：

- 自定义项渲染：灵活地渲染复杂的项结构
- `estimateSize`: 设置静态或动态项目的估算项目高度
- `overscan`: 控制在可见区域之外渲染的项目数
- `textContent`: 每个项目的文本内容，实现提前输入（type-ahead）功能

## 用法

以下是确保虚拟化正常工作的一些重要说明！

1. 固定高度/最大高度换行 `<Virtualizer />`。
2. 保持一致的项目高度，并适当设置 `estimateSize` 属性。
3. 设置 `textContent` 属性以确保提前输入的可访问性。

## 示例

```vue
<script setup>
import { ComboboxContent, ComboboxItem, ComboboxRoot, ComboboxViewport, ComboboxVirtualizer } from 'reka-ui'

const items = [
  // … large array of items
]
</script>

<template>
  <ComboboxRoot>
    …
    <ComboboxContent>
      <!-- Make sure to set a height for Virtualizer's parent element -->
      <ComboboxViewport class="max-h-80 overflow-y-auto">
        <ComboboxVirtualizer
          v-slot="{ option }"
          :options="items"
          :estimate-size="25"
          :text-content="(opt) => opt.label"
        >
          <ComboboxItem :value="option">
            {{ option.label }}
          </ComboboxItem>
        </ComboboxVirtualizer>
      </ComboboxViewport>
    </ComboboxContent>
  </ComboboxRoot>
</template>
```

## 常见问题

### 虚拟化无法正常工作

请确保 `<Virtualizer>` 的父元素具有定义的高度！

```vue line=6
<template>
  <ComboboxRoot>
    …
    <ComboboxContent>
      <!-- Height must be defined -->
      <ComboboxViewport class="max-h-80 overflow-y-auto">
        <ComboboxVirtualizer>
          …
        </ComboboxVirtualizer>
      </ComboboxViewport>
    </ComboboxContent>
  </ComboboxRoot>
</template>
```
