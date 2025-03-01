---
title: 日期选择器
description: 通过输入和日历的界面进行日期的选择。
name: date-picker
---

# 日期选择器

<Badge>Alpha</Badge>

<Description>
通过输入和日历的界面进行日期的选择。
</Description>

<ComponentPreview name="DatePicker" />

## 特性

<Highlights
  :features="[
    '全键盘导航',
    '可以是受控的或非受控的',
    '焦点完全可控',
    '本地化支持',
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
  DatePickerAnchor,
  DatePickerArrow,
  DatePickerCalendar,
  DatePickerCell,
  DatePickerCellTrigger,
  DatePickerClose,
  DatePickerContent,
  DatePickerField,
  DatePickerGrid,
  DatePickerGridBody,
  DatePickerGridHead,
  DatePickerGridRow,
  DatePickerHeadCell,
  DatePickerHeader,
  DatePickerHeading,
  DatePickerInput,
  DatePickerNext,
  DatePickerPrev,
  DatePickerRoot,
  DatePickerTrigger,
} from 'reka-ui'
</script>

<template>
  <DatePickerRoot>
    <DatePickerField>
      <DatePickerInput />
      <DatePickerTrigger />
    </DatePickerField>

    <DatePickerAnchor />
    <DatePickerContent>
      <DatePickerClose />
      <DatePickerArrow />

      <DatePickerCalendar>
        <DatePickerHeader>
          <DatePickerPrev />
          <DatePickerHeading />
          <DatePickerNext />
        </DatePickerHeader>

        <DatePickerGrid>
          <DatePickerGridHead>
            <DatePickerGridRow>
              <DatePickerHeadCell />
            </DatePickerGridRow>
          </DatePickerGridHead>

          <DatePickerGridBody>
            <DatePickerGridRow>
              <DatePickerCell>
                <DatePickerCellTrigger />
              </DatePickerCell>
            </DatePickerGridRow>
          </DatePickerGridBody>
        </DatePickerGrid>
      </DatePickerCalendar>
    </DatePickerContent>
  </DatePickerRoot>
</template>
```

## API 参考

### Root

包含日期选择器的所有部分

<!-- @include: @/zh/meta/DatePickerRoot.md -->

### Field

包含日期选择器日期字段区段和触发器

<!-- @include: @/zh/meta/DatePickerField.md -->

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

包含日期选择器日期字段区段

<!-- @include: @/zh/meta/DatePickerInput.md -->

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
    }
  ]"
/>

### Trigger

切换弹出面板的按钮。默认情况下，`DatePickerContent` 将自身定位在触发器上。

<!-- @include: @/zh/meta/DatePickerTrigger.md -->

### Content

弹出面板打开时弹出的组件。

<!-- @include: @/zh/meta/DatePickerContent.md -->

### Arrow

与弹出面板一起呈现的可选箭头元素。这可用于帮助视觉上将锚点与 `DatePickerContent` 链接。必须在 `DatePickerContent` 中。

<!-- @include: @/zh/meta/DatePickerArrow.md -->

### Close

关闭打开的日期选择器的按钮。

<!-- @include: @/zh/meta/DatePickerClose.md -->

### Anchor

用于定位 `DatePickerContent` 的可选元素。如果不使用此部分，内容将与 `DatePickerTrigger` 一起定位。

<!-- @include: @/zh/meta/DatePickerAnchor.md -->

### Calendar

包含日历的所有部分

<!-- @include: @/zh/meta/DatePickerCalendar.md -->

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
      attribute: '[data-readonly]',
      values: '只读时存在',
    }
  ]"
/>

### Header

包含导航按钮和标题段。

<!-- @include: @/zh/meta/DatePickerHeader.md -->

### Prev Button

日历导航按钮。它根据当前日历视图导航前一个月/年/十年的日历。

<!-- @include: @/zh/meta/DatePickerPrev.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    },
  ]"
/>

### Next Button

日历导航按钮。它根据当前日历视图导航后一个月/年/十年的日历。

<!-- @include: @/zh/meta/DatePickerNext.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    }
  ]"
/>

### Heading

显示当前月份和年份的标题

<!-- @include: @/zh/meta/DatePickerHeading.md -->

### Grid

用于包裹日历网格的容器。

<!-- @include: @/zh/meta/DatePickerGrid.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    },
    {
      attribute: '[data-readonly]',
      values: '只读时存在',
    }
  ]"
/>

### Grid Head

用于包裹网格头的容器。

<!-- @include: @/zh/meta/DatePickerGridHead.md -->

### Grid Body

用于包裹网格体的容器。

<!-- @include: @/zh/meta/DatePickerGridBody.md -->

### Grid Row

用于包裹网格行的容器。

<!-- @include: @/zh/meta/DatePickerGridRow.md -->

### Head Cell

用于包裹表头单元格的容器。用于显示星期几。

<!-- @include: @/zh/meta/DatePickerHeadCell.md -->

### Cell

用于包裹日历单元格的容器。

<!-- @include: @/zh/meta/DatePickerCell.md -->

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

<!-- @include: @/zh/meta/DatePickerCellTrigger.md -->

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

## 无障碍

### 键盘交互

<KeyboardTable
  :data="[
    {
      keys: ['Tab'],
      description: '当焦点移动到日期字段时，聚焦第一段。'
    },
    {
      keys: ['Space'],
      description:`
      <span>
          当焦点位于<Code>DatePickerNext</Code>或<Code>DatePickerPrev</Code>时，它会导航日历。否则，它会选择日期。如果焦点位于<Code>DatePickerTrigger</Code>，它会打开/关闭弹出面板。
      </span>
    ` ,
    },
    {
      keys: ['Enter'],
      description:`
      <span>
          当焦点位于<Code>DatePickerNext</Code>或<Code>DatePickerPrev</Code>时，它会导航日历。否则，它会选择日期。如果焦点位于<Code>DatePickerTrigger</Code>，它会打开/关闭弹出面板。
      </span>
    ` ,
    },
    {
      keys: ['ArrowLeft', 'ArrowRight'],
      description:
      `
         在日期字段区段之间导航。如果焦点在<Code>DatePickerCalendar</Code>上，它会在日期之间导航。
      `
    },
    {
      keys: ['ArrowUp', 'ArrowDown'],
      description: '增加/更改区段的值。如果焦点在<Code>DatePickerCalendar</Code>上，它会在日期之间导航。'
    },
    {
      keys: ['0-9'],
      description: `
          当焦点在数字<Code>DatePickerInput</Code>上时，如果下一个输入会导致无效值，它会输入数字并聚焦下一个段。
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
