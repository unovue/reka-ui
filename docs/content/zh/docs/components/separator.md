---

title: 分割线
description: 在视觉上或语义上分隔内容。
name: separator
aria: https://www.w3.org/TR/wai-aria-1.2/#separator
---

# 分割线

<Description>
在视觉上或语义上分隔内容。
</Description>

<ComponentPreview name="Separator" />

## 特性

<Highlights :features="['支持水平和垂直方向']" />

## 安装

从命令行安装组件。

<InstallationTabs value="reka-ui" />

## 组件解析

导入所有零件并将它们拼凑在一起。

```vue
<script setup>
import { Separator } from 'reka-ui'
</script>

<template>
  <Separator />
</template>
```

## API 参考

### Root

分割线。

<!-- @include: @/zh/meta/Separator.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
  ]"
/>

## 无障碍

遵守 [separator 角色要求](https://www.w3.org/TR/wai-aria-1.2/#separator)。
