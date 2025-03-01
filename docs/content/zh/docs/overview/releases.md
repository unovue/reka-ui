---
title: 版本
description: 了解最新版本的 Reka UI。
---

# 版本

<Description>
了解最新版本的 Reka UI。
</Description>

[Github 上的最新版本](https://github.com/unovue/radix-vue/releases)

---

## 2.0 Changes

### ✨ 新特性

<Callout type="tip">

我们建议您查看[迁移指南](../guides/migration)，以便顺利从 v1 过渡到 v2。

</Callout>

#### 组件
- **TimeField**: 实现新的 TimeField 组件
- **Presence**: 暴露组件
- **ConfigProvider**: 为 locale 添加全局配置

#### 功能性
- **Checkbox**:
  - 支持多个值和更多类型
  -  将 roving focus props 添加到 group
- **ToggleGroup**: 支持更多类型
- **RadioGroup**:
  - 支持更多类型
  - 当用户单击项目时发出 'select' 事件
- **Select**: 支持不同的 modelValue 和 option 类型
- **Listbox/Combobox**:
  - 暴露 highlight 方法
  - 筛选更改时高亮显示第一项
- **NavigationMenu**:
  - 添加其他 CSS 变量以获得更好的定位
  - 添加 SSR 支持
- **Collapsible/Accordion**: 添加 `unmount` 属性以助于隐藏内容的 SEO

#### 开发人员体验
- **类型**:
  - 公开有用的类型
  - 在 `usePrimitiveElement` 中允许类型推理
- **过滤**: 新增了 `useFilter` 组合式函数，便于过滤
- **Bundle**: Bundle with preserveModules, rollup types dts

### 🔧 重构

- **Form Components**:
  - 在根节点内移动视觉上隐藏的输入元素
- **Combobox**:
  - 使用 Listbox 作为基本组件
  - 删除 ComboboxEmpty
- **Popper**:
  - 允许自定义引用 el 或虚拟 el
  - 添加位置策略和 updateOnLayoutShift 属性
  - 重命名 props 使得更清晰

### 🐛 Bug 修复

- **NavigationMenu**: 动画后重置位置
- **Accordion**: 修复导致闪烁的 SSR 动画
- **Listbox**: 使用 pointermove 时阻止滚动
- **Combobox**:
  - 修复基于搜索值的空状态
  - 修复初始搜索不起作用和虚拟化器问题
- **Select**: 修复箭头抛出内容上下文注入错误
- **VisuallyHidden**: 修复了在本机表单验证后无法聚焦的问题

### 🚨 重大更改

- **Form Components**:
  - 将受控状态重命名为 `v-model`
- **Popover**: 更新 aria 属性并删除杂乱的属性
- **Select**:
  - 修复 SSR 支持
  - 重构 SelectValue 渲染机制
- **Arrow**: 改进多边形实现
- **Calendar**: 删除已弃用的 `step` prop
