---

title: 日历
description: 显示日期和星期几，便于进行与日期相关的交互。
name: calendar
---

# 日历

<Badge>Alpha</Badge>

<Description>
显示日期和星期几，便于进行与日期相关的交互。
</Description>

<ComponentPreview name="Calendar" />

## 特性

<Highlights
  :features="[
    '全键盘导航',
    '可以是受控的或非受控的',
    '焦点完全可控',
    '本地化支持',
    '高度可组合'
  ]"
/>

## 前言

该组件依赖于 [@internationalized/date](https://react-spectrum.adobe.com/internationalized/date/index.html) 包，这个包解决了在 JavaScript 中处理日期和时间时出现的许多问题。

我们强烈建议通读该包的文档，以便深入了解它的工作原理，并且你需要在你的项目中安装它才能使用与日期相关的组件。

## 安装

安装日期包。

<InstallationTabs value="@internationalized/date" />

从命令行安装组件。

<InstallationTabs value="reka-ui" />

## 组件解析

导入所有零件并将它们拼凑在一起。

```vue
<script setup>
import {
  CalendarCell,
  CalendarCellTrigger,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHead,
  CalendarGridRow,
  CalendarHeadCell,
  CalendarHeader,
  CalendarHeading,
  CalendarNext,
  CalendarPrev,
  CalendarRoot
} from 'reka-ui'
</script>

<template>
  <CalendarRoot>
    <CalendarHeader>
      <CalendarPrev />
      <CalendarHeading />
      <CalendarNext />
    </CalendarHeader>
    <CalendarGrid>
      <CalendarGridHead>
        <CalendarGridRow>
          <CalendarHeadCell />
        </CalendarGridRow>
      </CalendarGridHead>
      <CalendarGridBody>
        <CalendarGridRow>
          <CalendarCell>
            <CalendarCellTrigger />
          </CalendarCell>
        </CalendarGridRow>
      </CalendarGridBody>
    </CalendarGrid>
  </CalendarRoot>
</template>
```

## API 参考

### Root

包含日历的所有部分。

<!-- @include: @/zh/meta/CalendarRoot.md -->

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

### Header

包含导航按钮和标题部分。

<!-- @include: @/zh/meta/CalendarHeader.md -->

### Prev Button

日历导航按钮。它根据当前日历视图将日历向后导航一个月/年/十年。

<!-- @include: @/zh/meta/CalendarPrev.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    },
  ]"
/>

### Next Button

日历导航按钮。它根据当前日历视图将日历向前导航一个月/年/十年。

<!-- @include: @/zh/meta/CalendarNext.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    },
  ]"
/>

### Heading

用于显示当前月份和年份的标题

<!-- @include: @/zh/meta/CalendarHeading.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    }
  ]"
/>

### Grid

用于包裹日历网格的容器。

<!-- @include: @/zh/meta/CalendarGrid.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-readonly]',
      values: '只读时存在',
    },
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    }
  ]"
/>

### Grid Head

用于包裹网格头部的容器。

<!-- @include: @/zh/meta/CalendarGridHead.md -->

### Grid Body

用于包裹网格主体的容器。

<!-- @include: @/zh/meta/CalendarGridBody.md -->

### Grid Row

用于包裹网格行的容器。

<!-- @include: @/zh/meta/CalendarGridRow.md -->

### Head Cell

用于包裹表头单元格的容器。用于显示星期几。

<!-- @include: @/zh/meta/CalendarHeadCell.md -->

### Cell

用于包裹日历单元格的容器。

<!-- @include: @/zh/meta/CalendarCell.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    },
  ]"
/>

### Cell Trigger

用于显示单元格日期的可交互容器。点击它可选择日期。

<!-- @include: @/zh/meta/CalendarCellTrigger.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-selected]',
      values: '选中时存在',
    },
    {
      attribute: '[data-value]',
      values: '日期的 ISO 字符串值。',
    },
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    },
    {
      attribute: '[data-unavailable]',
      values: '不可用状态时存在',
    },
    {
      attribute: '[data-today]',
      values: '今天时存在',
    },
    {
      attribute: '[data-outside-view]',
      values: '如果日期在其显示所在的当前月份之外，则会出现。',
    },
    {
      attribute: '[data-outside-visible-view]',
      values: '当日期在日历上可见的月份之外时出现。',
    },
    {
      attribute: '[data-focused]',
      values: '聚焦时存在',
    }
  ]"
/>

## 示例

### 带有年份递增功能的日历

这个示例展示了一个可以增加年份的日历。

<ComponentPreview name="CalendarYearIncrement" />

### 带有区域设置和日历系统选择的日历

此示例展示了一些可用的区域设置以及日历系统的显示方式。

<ComponentPreview name="CalendarSelect" />

## 无障碍

### 键盘交互

<KeyboardTable
  :data="[
    {
      keys: ['Tab'],
      description: '当焦点移动到日历上时，聚焦第一个导航按钮。'
    },
    {
      keys: ['Space'],
      description:`
      <span>
          当焦点位于<Code>CalendarNext</Code>或<Code>CalendarPrev</Code>时，它会导航日历。否则，它会选择日期。
      </span>
    ` ,
    },
    {
      keys: ['Enter'],
      description:`
      <span>
          当焦点位于<Code>CalendarNext</Code>或<Code>CalendarPrev</Code>时，它会导航日历。否则，它会选择日期。
      </span>
    ` ,
    },
    {
      keys: ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'],
      description:
      `
        当焦点位于<Code>CalendarCellTrigger</Code>时，它会导航日期，并在必要时更改月/年/十年。
      `
    }
  ]"
/>
