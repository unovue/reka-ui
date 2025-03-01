---

title: 标签
description: 呈现与控件关联的无障碍标签。
name: label
---

# 标签

<Description>
呈现与控件关联的无障碍标签。
</Description>

<ComponentPreview name="Label" />

## 特性

<Highlights
  :features="[
    '双击标签时阻止文本选择',
    '支持嵌套控件',
  ]"
/>

## 安装

从命令行安装组件。

<InstallationTabs value="reka-ui" />

## 组件解析

导入组件。

```vue
<script setup>
import { Label } from 'reka-ui'
</script>

<template>
  <Label />
</template>
```

## API 参考

### Root

包含标签的内容。

<!-- @include: @/zh/meta/Label.md -->

## 无障碍

此组件基于原生 `label` 元素，在包装控件或使用 `for` 属性时，它将自动应用正确的标签。要使您自己的自定义控件正常工作，请确保它们使用原生元素（如 `button` 或 `input`）作为基础。
