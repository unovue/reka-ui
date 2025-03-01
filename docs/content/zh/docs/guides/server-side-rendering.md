---
title: 服务器端渲染
description: Reka UI 可以在服务器上渲染。
---

# 服务器端渲染

<Description>
Reka UI 可以在服务器上渲染。
</Description>

## 概述

服务器端渲染或 `SSR` 是一种用于在服务器上将组件渲染为 HTML 的技术，而不是仅在客户端上渲染它们。

静态渲染是另一种类似的方法。相反，它在构建时将页面预渲染为 HTML，而不是在每个请求时。

您应该能够将我们所有的 primitives 与两种方法一起使用，例如使用 [Nuxt.js](https://nuxt.com/)。

## Nuxt 水合问题 （View < 3.5）

Reka UI 提供了一个支持自动导入组件的 [Nuxt 模块](/zh/docs/overview/installation.html#nuxt-modules)。但是，如果你使用的是 Vue < 3.5，可能会出现轻微的激活问题，因为从 vue <= 3.4 [目前无法](https://github.com/vuejs/rfcs/discussions/557)确保客户端和服务器渲染之间的 DOM 元素 id 一致。这是 Reka UI 所依赖的。

作为临时解决方法，我们公开了一种方法，允许 Nuxt（版本 > 3.10）将其 `useId` 实现注入 `reka-ui`。

要提供自定义 `useId` 实现，请遵循本[指南](/zh/docs/utilities/config-provider.html#hydration-issue-vue-3-5)。
