---

title: 范围日历
description: 为选择日期范围而定制的日历视图。
name: range-calendar
---

# 范围日历

<Badge>Alpha</Badge>

<Description>
为选择日期范围而定制的日历视图。
</Description>

<ComponentPreview name="RangeCalendar" />

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

从命令行安装此组件

<InstallationTabs value="reka-ui" />

## 组件解析

导入所有零件并将它们拼凑在一起。

```vue
<script setup>
import {
  RangeCalendarCell,
  RangeCalendarCellTrigger,
  RangeCalendarGrid,
  RangeCalendarGridBody,
  RangeCalendarGridHead,
  RangeCalendarGridRow,
  RangeCalendarHeadCell,
  RangeCalendarHeader,
  RangeCalendarHeading,
  RangeCalendarNext,
  RangeCalendarPrev,
  RangeCalendarRoot
} from 'reka-ui'
</script>

<template>
  <RangeCalendarRoot>
    <RangeCalendarHeader>
      <RangeCalendarPrev />
      <RangeCalendarHeading />
      <RangeCalendarNext />
    </RangeCalendarHeader>
    <RangeCalendarGrid>
      <RangeCalendarGridHead>
        <RangeCalendarGridRow>
          <RangeCalendarHeadCell />
        </RangeCalendarGridRow>
      </RangeCalendarGridHead>
      <RangeCalendarGridBody>
        <RangeCalendarGridRow>
          <RangeCalendarCell>
            <RangeCalendarCellTrigger />
          </RangeCalendarCell>
        </RangeCalendarGridRow>
      </RangeCalendarGridBody>
    </RangeCalendarGrid>
  </RangeCalendarRoot>
</template>
```

## API 参考

### Root

包含日历的所有部分

<!-- @include: @/zh/meta/RangeCalendarRoot.md -->

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

包含导航按钮和标题段。

<!-- @include: @/zh/meta/RangeCalendarHeader.md -->

### Prev Button

日历导航按钮。它根据当前日历视图导航前一个月/年/十年的日历。

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    },
  ]"
/>

<!-- @include: @/zh/meta/RangeCalendarPrev.md -->

### Next Button

日历导航按钮。它根据当前日历视图导航后一个月/年/十年的日历。

<!-- @include: @/zh/meta/RangeCalendarNext.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    },
  ]"
/>

### Heading

显示当前月份和年份的标题。

<!-- @include: @/zh/meta/RangeCalendarHeading.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    },
  ]"
/>

### Grid

用于包裹日历网格的容器。

<!-- @include: @/zh/meta/RangeCalendarGrid.md -->

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
  ]"
/>

### Grid Head

用于包裹网格头的容器。

<!-- @include: @/zh/meta/RangeCalendarGridHead.md -->

### Grid Body

用于包裹网格体的容器。

<!-- @include: @/zh/meta/RangeCalendarGridBody.md -->

### Grid Row

用于包裹网格行的容器。

<!-- @include: @/zh/meta/RangeCalendarGridRow.md -->

### Head Cell

用于包裹表头单元格的容器。用于显示星期几。

<!-- @include: @/zh/meta/RangeCalendarHeadCell.md -->

### Cell

用于包裹日历单元格的容器。

<!-- @include: @/zh/meta/RangeCalendarCell.md -->

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

<!-- @include: @/zh/meta/RangeCalendarCellTrigger.md -->

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
      attribute: '[data-selection-start]',
      values: '当日期是选择的开始时存在。',
    },
    {
      attribute: '[data-selection-end]',
      values: '当日期是选择的结尾时存在。',
    },
    {
      attribute: '[data-highlighted]',
      values: '当用户在选择范围时突出显示日期时存在。',
    },
    {
      attribute: '[data-highlighted-start]',
      values: '当日期是用户突出显示的范围的开始时存在。',
    },
    {
      attribute: '[data-highlighted-end]',
      values: '当日期是用户突出显示的范围的结尾时存在。',
    },
    {
      attribute: '[data-focused]',
      values: '聚焦时存在',
    }
  ]"
/>

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
