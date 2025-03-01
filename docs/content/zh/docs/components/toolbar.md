---

title: 工具栏
description: 用于对一组控件（如按钮、工具栏组或下拉菜单）进行分组的容器。
name: toolbar
aria: https://www.w3.org/WAI/ARIA/apg/patterns/toolbar
---

# 工具栏

<Description>
用于对一组控件（如按钮、工具栏组或下拉菜单）进行分组的容器。
</Description>

<ComponentPreview name="Toolbar" />

## 特性

<Highlights :features="['全键盘导航']" />

## 安装

从命令行安装组件。

<InstallationTabs value="reka-ui" />

## 组件解析

导入组件。

```vue
<script setup lang="ts">
import {
  ToolbarButton,
  ToolbarLink,
  ToolbarRoot,
  ToolbarSeparator,
  ToolbarToggleGroup,
  ToolbarToggleItem,
} from 'reka-ui'
</script>

<template>
  <ToolbarRoot>
    <ToolbarButton />
    <ToolbarSeparator />
    <ToolbarLink />
    <ToolbarToggleGroup>
      <ToolbarToggleItem />
    </ToolbarToggleGroup>
  </ToolbarRoot>
</template>
```

## API 参考

### Root

包含所有工具栏组件部件。

<!-- @include: @/zh/meta/ToolbarRoot.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
  ]"
/>

### Button

按钮项。

<!-- @include: @/zh/meta/ToolbarButton.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
  ]"
/>

### Link

链接项。

<!-- @include: @/zh/meta/ToolbarLink.md -->

### ToggleGroup

一组可以打开或关闭的双状态按钮。

<!-- @include: @/zh/meta/ToolbarToggleGroup.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
  ]"
/>

### ToggleItem

组中的项。

<!-- @include: @/zh/meta/ToolbarToggleItem.md -->

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

### Separator

用于视觉上分隔工具栏中的项目

<!-- @include: @/zh/meta/ToolbarSeparator.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
  ]"
/>

## 示例

### 与其他 Primitives 一起使用

我们所有 Primitives 暴露 `Trigger` 部件 ，例如 `Dialog`、`AlertDialog`、`Popover`、`DropdownMenu`，都可以使用 [`asChild` 属性](/zh/docs/guides/composition)在工具栏中组合。

下面是一个使用 `DropdownMenu` 基元的示例。

```vue line=20-22
<script setup lang="ts">
import {
  DropdownMenuContent,
  DropdownMenuRoot,
  DropdownMenuTrigger,
  ToolbarButton,
  ToolbarLink,
  ToolbarRoot,
  ToolbarSeparator,
  ToolbarToggleGroup,
  ToolbarToggleItem,
} from 'reka-ui'
</script>

<template>
  <ToolbarRoot>
    <ToolbarButton>Action 1</ToolbarButton>
    <ToolbarSeparator />
    <DropdownMenuRoot>
      <ToolbarButton as-child>
        <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
      </ToolbarButton>
      <DropdownMenuContent>…</DropdownMenuContent>
    </DropdownMenuRoot>
  </ToolbarRoot>
</template>
```

## 无障碍

使用[浮动 tabindex](https://www.w3.org/TR/wai-aria-practices-1.2/examples/radio/radio.html) 管理项之间的焦点移动。

### 键盘交互

<KeyboardTable
  :data="[
    {
      keys: ['Tab'],
      description: '将焦点移动到组中的第一项。',
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
      description: '<span> 根据<Code>orientation</Code>将焦点移动到下一项。</span>',
    },
    {
      keys: ['ArrowRight'],
      description: '<span> 根据<Code>orientation</Code>将焦点移动到下一项。</span>',
    },
    {
      keys: ['ArrowUp'],
      description: '<span>根据<Code>orientation</Code>将焦点移动到上一项。</span>',
    },
    {
      keys: ['ArrowLeft'],
      description: '<span>根据<Code>orientation</Code>将焦点移动到上一项。</span>',
    },
    {
      keys: ['Home'],
      description: '<span>将焦点移至第一项。</span>',
    },
    {
      keys: ['End'],
      description: '<span>将焦点移至最后一项。</span>',
    },
  ]"
/>
