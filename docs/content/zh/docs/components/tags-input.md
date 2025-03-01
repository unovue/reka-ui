---
title: 标签输入
description: 标签输入在输入框内渲染标签，后跟实际的文本输入。
name: tags-input
---

# 标签输入

<Description>
标签输入在输入框内渲染标签，后跟实际的文本输入。
</Description>

<ComponentPreview name="TagsInput" />

## 特性

<Highlights
  :features="[
    '可以是受控的或非受控的',
    '全键盘导航',
    '限制标签数量',
    '接受剪贴板中的值',
    '清除按钮可重置所有标签值'
  ]"
/>

## 安装

从命令行安装组件。

<InstallationTabs value="reka-ui" />

## 组件解析

导入所有零件并将它们拼凑在一起。

```vue
<script setup>
import { TagsInputClear, TagsInputDelete, TagsInputInput, TagsInputItem, TagsInputRoot, TagsInputText } from 'reka-ui'
</script>

<template>
  <TagsInputRoot>
    <TagsInputItem>
      <TagsInputItemText />
      <TagsInputItemDelete />
    </TagsInputItem>

    <TagsInputInput />
    <TagsInputClear />
  </TagsInputRoot>
</template>
```

## API 参考

### Root

包含标签输入组件的所有部件。

<!-- @include: @/zh/meta/TagsInputRoot.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    },
    {
      attribute: '[data-focused]',
      values: 'Present when focus on input',
    },
    {
      attribute: '[data-invalid]',
      values: 'Present when input value is invalid',
    },
  ]"
/>

### Item

包含标签的组件。

<!-- @include: @/zh/meta/TagsInputItem.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['active', 'inactive'],
    },
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    },
  ]"
/>

### ItemText

标签的文本部分。对于辅助功能很重要。

<!-- @include: @/zh/meta/TagsInputItemText.md -->

### ItemDelete

用于删除对应标签的按钮。

<!-- @include: @/zh/meta/TagsInputItemDelete.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['active', 'inactive'],
    },
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    },
  ]"
/>

### Input

标签输入的输入框元素。

<!-- @include: @/zh/meta/TagsInputInput.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-invalid]',
      values: 'Present when input value is invalid',
    },
  ]"
/>

### Clear

删除所有标签的按钮。

<!-- @include: @/zh/meta/TagsInputClear.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    },
  ]"
/>

## 示例

### 复选框

你可以把标签输入和[Combobox](../components/combobox.html)结合。

<ComponentPreview name="TagsInputCombobox" />

### 粘贴行为

你可以通过传递 `add-on-paste` 属性在粘贴时自动添加标签。

```vue line=8
<script setup lang="ts">
import { TagsInputInput, TagsInputItem, TagsInputItemDelete, TagsInputItemText, TagsInputRoot } from 'reka-ui'
</script>

<template>
  <TagsInputRoot
    v-model="modelValue"
    add-on-paste
  >
    …
  </TagsInputRoot>
</template>
```

### 多个分隔符

您可以将 `RegExp` 作为 `delimiter` 传递，以允许多个字符触发添加新标签。当 `add-on-paste` 被传递时，它还将用于拆分 `@paste` 事件的标签。

```vue line=4-5,11
<script setup lang="ts">
import { TagsInputInput, TagsInputItem, TagsInputItemDelete, TagsInputItemText, TagsInputRoot } from 'reka-ui'

// split by space, comma, semicolon, tab, or newline
const delimiter = /[ ,;\t\n\r]+/
</script>

<template>
  <TagsInputRoot
    v-model="modelValue"
    :delimiter="delimiter"
    add-on-paste
  >
    …
  </TagsInputRoot>
</template>
```

## 无障碍

### 键盘交互

<KeyboardTable
  :data="[
    {
      keys: ['Delete'],
      description: '<span> 当标签处于活动状态时，将其删除并将标签设置为右激活（right active）。</span>',
    },
    {
      keys: ['Backspace'],
      description: '<span> 当标签处于活动状态时，将其删除并将标签设置为左激活（left active）。如果左侧没有标签，则下一个标签或输入框将获得焦点。</span>',
    },
    {
      keys: ['ArrowRight'],
      description: '<span>将下一个标签设置为活动状态。</span>',
    },
    {
      keys: ['ArrowLeft'],
      description: '<span>将上一个标签设置为活动状态。</span>',
    },
    {
      keys: ['Home'],
      description: '<span>将第一个标签设置为活动状态。</span>',
    },
    {
      keys: ['End'],
      description: '<span>将最后一个标签设置为活动状态。</span>',
    },
  ]"
/>
