---
title: 日期字段
description: 使用户能够在指定字段中输入特定日期。
name: date-field
---

# 日期字段

<Badge>Alpha</Badge>

<Description>
使用户能够在指定字段中输入特定日期。
</Description>

<ComponentPreview name="DateField" />

## 特性

<Highlights
  :features="[
    '全键盘导航',
    '可以是受控的或非受控的',
    '焦点完全可控',
    '本地化支持',
    '高度可组合',
    '默认无障碍',
    '支持日期格式和日期时间格式'
  ]"
/>

## 前言

该组件依赖于 [@internationalized/date](https://react-spectrum.adobe.com/internationalized/date/index.html) 包，这个包解决了在 JavaScript 中处理日期和时间时出现的许多问题。

我们强烈建议通读该包的文档，以便深入了解它的工作原理，并且你需要在你的项目中安装它才能使用与日期相关的组件。

## 安装

安装日期包。

<InstallationTabs value="@internationalized/date" />

从命令行安装此组件

<InstallationTabs value="reka-ui" />

## 组件解析

导入所有零件并将它们拼凑在一起。

```vue
<script setup>
import {
  DateFieldInput,
  DateFieldRoot,
} from 'reka-ui'
</script>

<template>
  <DateFieldRoot>
    <DateFieldInput />
  </DateFieldRoot>
</template>
```

## API 参考

### Root

包含日期字段的所有部分

<!-- @include: @/zh/meta/DateFieldRoot.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-readonly]',
      values: '只读时存在',
    },
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    },
    {
      attribute: '[data-invalid]',
      values: '不合法时存在',
    }
  ]"
/>

### Input

包含日期字段区段

<!-- @include: @/zh/meta/DateFieldInput.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    },
    {
      attribute: '[data-invalid]',
      values: '不合法时存在',
    },
    {
      attribute: '[data-placeholder]',
      values: '没有设置值时存在',
    },
  ]"
/>

## 无障碍

### 键盘交互

<KeyboardTable
  :data="[
    {
      keys: ['Tab'],
      description: '当焦点移动到日期字段时，聚焦第一段。'
    },
    {
      keys: ['ArrowLeft', 'ArrowRight'],
      description:
      `
         在日期字段区段之间导航。
      `
    },
    {
      keys: ['ArrowUp', 'ArrowDown'],
      description: '增加/更改区段的值。'
    },
    {
      keys: ['0-9'],
      description: `
          当焦点在数字<Code>DateFieldInput</Code>上时，如果下一个输入会导致无效值，它会输入该数字并聚焦下一个段。
      `
    },
    {
      keys: ['Backspace'],
      description: '从聚焦的数字区段中删除一个数字。'
    },
    {
      keys: ['A', 'P'],
      description: '当焦点在白天时，它会将其设置为上午或下午。'
    }
  ]"
/>
