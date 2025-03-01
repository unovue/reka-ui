---

title: 头像
description: 带有回退功能的图像元素，用于表示用户。
name: avatar
---

# 头像

<Description>
带有回退功能的图像元素，用于表示用户。
</Description>

<ComponentPreview name="Avatar" />

## 特性

<Highlights
  :features="[
    '自动和手动控制图像渲染。',
    '备用部分接受任何子元素。',
    '可选地延迟回退渲染以避免内容闪烁。',
  ]"
/>

## 安装

从命令行安装组件。

<InstallationTabs value="reka-ui" />

## 组件解析

导入所有零件并将它们拼凑在一起。

```vue
<script setup>
import { AvatarImage, AvatarRoot } from 'reka-ui'
</script>

<template>
  <AvatarRoot>
    <AvatarImage />
    <AvatarFallback />
  </AvatarRoot>
</template>
```

## API 参考

### Root

包含头像的所有部分。

<!-- @include: @/zh/meta/AvatarRoot.md -->

### Image

要渲染的图像。默认情况下，仅在图像加载后才会渲染。如果需要更多控制，可以使用 `@loadingStatusChange` 处理。

<!-- @include: @/zh/meta/AvatarImage.md -->

### Fallback

当图像未加载时呈现的元素。这意味着在加载期间或出现错误时。如果在加载过程中注意到闪烁，可以提供一个 `delayMs` 属性来延迟其呈现，以便仅为连接速度较慢的用户呈现。如需更多控制，请在 `AvatarImage` 上触发 `@loadingStatusChange` 事件。

<!-- @include: @/zh/meta/AvatarFallback.md -->

## 示例

### 带有工具提示的可点击头像

您可以将头像与[工具提示](/zh/docs/components/tooltip)组合使用以显示额外信息。

```vue line=6-7,9,11-15
<script setup>
import { AvatarImage, AvatarRoot, TooltipArrow, TooltipRoot, TooltipTrigger } from 'reka-ui'
</script>

<template>
  <TooltipRoot>
    <TooltipTrigger>
      <AvatarRoot>…</AvatarRoot>
    </TooltipTrigger>

    <TooltipContent side="top">
      Tooltip content
      <TooltipArrow />
    </TooltipContent>
  </TooltipRoot>
</template>
```
