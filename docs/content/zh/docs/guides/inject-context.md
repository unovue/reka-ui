---
title: 注入上下文
description: 利用 `injectContext` 增强 Reka UI 中的组件组合，实现强大而灵活的 UI 开发。
---

# 注入上下文

<Description>

利用 `injectContext` 增强 Reka UI 中的组件组合，实现强大而灵活的 UI 开发。

</Description>

<Callout type="warning" title="请谨慎使用！API 可能会更改">

Reka UI 公开了内部 `injectContext`，以进一步扩展组合和构建复杂组件的能力。但是，此 API 主要设计为供内部使用。因此，API 可能会更改，恕不另行通知。

</Callout>

## `injectContext` 简介

在 Reka UI 中，所有根组件和一些其他组件都会导出一个 `injectContext` 函数，这是管理组件状态和实现无缝组合的关键功能。本指南将向你展示如何根据提供的上下文制作自己的子组件。

## 什么是 `injectContext`？

`injectContext` 是每个 Reka UI 组件提供的函数，允许您访问该组件的内部状态和方法。

它利用 Vue 的 [依赖注入](https://cn.vuejs.org/guide/components/provide-inject) 来提供一种扩展和自定义组件行为的强大方法。

## 基本用法

下面是一个如何将 `injectContext` 与 Reka UI Accordion 组件一起使用的简单示例：

```vue
<!-- CustomAccordionContent.vue -->
<script setup>
import { injectAccordionItemContext, injectAccordionRootContext } from 'reka-ui'

const accordionRootContext = injectAccordionRootContext()
const accordionItemContext = injectAccordionItemContext()

const isSingleOpen = computed(() =>
  accordionRootContext.isSingle.value && accordionItemContext.open.value
)
</script>

<template>
  <div>
    …
  </div>
</template>
```

## 常见用例

1. **自定义样式**: Access internal state 以根据组件状态应用动态样式。
2. **扩展功能**: 基于现有组件逻辑构建以添加新功能。
3. **复杂布局**: 通过组合多个组件并在它们之间共享状态来创建复杂的 UI 模式。
4. **辅助功能增强**: 利用内部方法和状态来改进键盘导航或屏幕阅读器支持。

## 最佳实践

1. 在子组件或组合式函数中使用 `injectContext`，而不是在组件本身中使用。
2. 在使用之前，请务必检查注入的上下文是否存在，因为如果在组件范围之外使用，则它可能是 `undefined`。
3. 尽可能首选使用提供的 props 和事件，并在更高级的场景中使用 `injectContext`。
4. 使用 TypeScript 时，利用 `injectContext` 提供的类型信息来提高代码质量。
