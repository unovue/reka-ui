---

title: 单选组
description: 一组可选中的按钮（称为单选按钮），其中一次只能选中一个按钮。
name: radio-group
aria: https://www.w3.org/WAI/ARIA/apg/patterns/radiobutton
---

# 单选组

<Description>
一组可选中的按钮（称为单选按钮），其中一次只能选中一个按钮。
</Description>

<ComponentPreview name="RadioGroup" />

## 特性

<Highlights
  :features="[
    '全键盘导航',
    '支持水平/垂直方向',
    '可以是受控的或非受控的',
  ]"
/>

## 安装

从命令行安装组件。

<InstallationTabs value="reka-ui" />

## 组件解析

导入所有零件并将它们拼凑在一起。

```vue
<script setup>
import { RadioGroupIndicator, RadioGroupItem, RadioGroupRoot } from 'reka-ui'
</script>

<template>
  <RadioGroupRoot>
    <RadioGroupItem>
      <RadioGroupIndicator />
    </RadioGroupItem>
  </RadioGroupRoot>
</template>
```

## API 参考

### Root

包含单选组的所有部件。

<!-- @include: @/zh/meta/RadioGroupRoot.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    },
  ]"
/>

### Item

组中可以选中的项目。在 `form` 中使用时，`input` 也会渲染，以确保事件正确传播。

<!-- @include: @/zh/meta/RadioGroupItem.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['checked', 'unchecked'],
    },
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    },
  ]"
/>

### Indicator

当单选按钮项处于选中状态时渲染。您可以直接设置此元素的样式，也可以将其用作包装器以将图标放入其中，或两者兼而有之。

<PresenceCallout />

<!-- @include: @/zh/meta/RadioGroupIndicator.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['checked', 'unchecked'],
    },
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    },
  ]"
/>

## 无障碍

遵循[单选组 WAI-ARIA 设计模式](https://www.w3.org/WAI/ARIA/apg/patterns/radiobutton)，并使用[移动 tabindex](https://www.w3.org/TR/wai-aria-practices-1.2/examples/radio/radio.html)来管理单选项之间的焦点移动。

### 键盘交互

<KeyboardTable
  :data="[
    {
      keys: ['Tab'],
      description: '将焦点移动到选中的单选按钮项或组中的第一个单选按钮项。',
    },
    {
      keys: ['Space'],
      description: '当焦点位于未选中的单选项上时，选中它。',
    },
    {
      keys: ['ArrowDown'],
      description: '移动焦点并选中组中的下一个单选项。',
    },
    {
      keys: ['ArrowRight'],
      description: '移动焦点并选中组中的下一个单选项。',
    },
    {
      keys: ['ArrowUp'],
      description: '移动焦点到组内的上一个单选项',
    },
    {
      keys: ['ArrowLeft'],
      description: '移动焦点到组内的上一个单选项',
    },
  ]"
/>
