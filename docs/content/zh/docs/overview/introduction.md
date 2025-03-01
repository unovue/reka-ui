---
title: 介绍
description: 一个开源 UI 组件库，使用 Vue.js 构建高质量、可访问的设计系统和 Web 应用程序。
---

<script setup>
import Contributors from '../../../../.vitepress/components/Contributors.vue'
</script>

# 介绍

<Description>

一个开源 UI 组件库，使用 [Vue.js](https://cn.vuejs.org) 构建高质量、可访问的设计系统和 Web 应用程序。

</Description>

## ✨ 品牌重塑: Reka UI ✨

展示 **Reka UI**，这是 [Radix Vue](https://www.radix-vue.com/) 在其 v2 演变中的新身份。

**Reka**（发音为 `/ree·kuh/`）在[马来语Malay](https://translate.google.com/?hl=en&sl=ms&tl=en&text=reka&op=translate)中意为“设计”，也让人联想到“Eureka”。

Reka UI 致力于提供以辅助功能、自定义和开发人员体验为中心的低级 UI 组件库。使用这些组件作为设计系统的基础，或逐步集成它们。

在[此处](/zh/docs/overview/releases#_2-0-changes)查看发行说明

<Callout type="tip">

对品牌重塑感到好奇吗？请参阅[此讨论](https://github.com/unovue/radix-vue/issues/908)中的公告。

</Callout>

## 我们的原则

### 无障碍优先

无障碍是 Reka UI 的核心。我们的组件与 [WAI-ARIA 设计模式](https://www.w3.org/TR/wai-aria-practices-1.2)保持一致，以确保所有用户，无论能力如何，都可以有效地与您的 UI 交互。我们处理复杂的辅助功能细节，如 aria 属性、键盘导航和焦点管理，以简化开发人员的工作。

### 可定制 & 无样式

Reka UI 组件是无样式的，让开发人员可以自由地使用任何 CSS 解决方案（原生 CSS、预处理器或 CSS-in-JS 库）按照他们选择的方式设置样式。我们的开放式组件架构允许您根据需要包装、扩展或修改每个组件。在我们的[样式指南](../guides/styling)中探索更多内容。

### 开放 & 模块化

我们的组件设计为开放且适应性强，允许您自定义每个元素以满足您的需求。无论是添加事件侦听器、props 还是 refs，Reka UI 都提供了对每个组件内部工作原理的精细访问。

### 灵活的状态管理

默认情况下，Reka UI 组件不受控，但也可以在需要时完全受控。这种方法允许开发人员决定所需的状态管理级别，从而在灵活性和易用性之间取得平衡。

### 以开发人员为中心的体验

我们通过维护一致且可预测的 API 来优先考虑开发人员体验。Reka UI 是完全类型和结构化的，考虑到了简单性，确保组件易于使用和集成。我们的 `asChild` prop 允许完全控制渲染的元素，从而提高灵活性。

### 性能与摇树效应

我们的库在设计时充分考虑了性能。所有组件都编译到一个包中，使安装变得简单明了，并确保任何未使用的组件都不会因 tree-shaking 而增加您的捆绑包大小。

<Callout type="tip">

Reka UI 的灵感来自 [Radix UI](https://www.radix-ui.com/) 的原则和目标，共同致力于可访问性、定制和开发人员友好型设计。

</Callout>

---

# 由 Vue 爱好者💚构建

<Contributors />

# 感谢

所有都归功于这些开源作品和资源

- Radix UI - https://radix-ui.com
- React Aria - https://react-spectrum.adobe.com/react-aria
- Floating UI - https://floating-ui.com
- VueUse - https://vueuse.org
- HeadlessUI - https://headlessui.com
