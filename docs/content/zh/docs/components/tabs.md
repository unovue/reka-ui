---

title: 选项卡
description: 一组分层的内容部分（称为选项卡面板），一次显示一个。
name: tabs
aria: https://www.w3.org/WAI/ARIA/apg/patterns/tabpanel
---

# 选项卡

<Description>
一组分层的内容部分（称为选项卡面板），一次显示一个。
</Description>

<ComponentPreview name="Tabs" />

## 特性

<Highlights
  :features="[
    '可以是受控的或非受控的',
    '支持水平/垂直方向',
    '支持自动/手动激活',
    '全键盘导航',
  ]"
/>

## 安装

从命令行安装组件。

<InstallationTabs value="reka-ui" />

## 组件解析

导入所有零件并将它们拼凑在一起。

```vue
<script setup>
import { TabsContent, TabsIndicator, TabsList, TabsRoot, TabsTrigger } from 'reka-ui'
</script>

<template>
  <TabsRoot>
    <TabsList>
      <TabsIndicator />
      <TabsTrigger />
    </TabsList>
    <TabsContent />
  </TabsRoot>
</template>
```

## API 参考

### Root

包含所有选项卡组件部件。

<!-- @include: @/zh/meta/TabsRoot.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
  ]"
/>

### List

包含沿激活内容边缘对齐的触发器。

<!-- @include: @/zh/meta/TabsList.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
  ]"
/>

### Trigger

用于激活其关联内容的按钮。

<!-- @include: @/zh/meta/TabsTrigger.md -->

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
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
  ]"
/>

### Indicator

突出显示当前活动选项卡的指示器。

<!-- @include: @/zh/meta/TabsIndicator.md -->

<CssVariablesTable
  :data="[
    {
      cssVariable: '--reka-tabs-indicator-size',
      description: '指示器的大小。',
    },
    {
      cssVariable: '--reka-tabs-indicator-position',
      description: '指示器的位置',
    },
  ]"
/>

### Content

包含与每个触发器关联的内容。

<PresenceCallout />

<!-- @include: @/zh/meta/TabsContent.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['active', 'inactive'],
    },
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
  ]"
/>

## 示例

### 纵向

你可以使用 `orientation` 属性创建垂直选项卡。

```vue line=6
<script setup>
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from 'reka-ui'
</script>

<template>
  <TabsRoot
    default-value="tab1"
    orientation="vertical"
  >
    <TabsList aria-label="tabs example">
      <TabsTrigger value="tab1">
        One
      </TabsTrigger>
      <TabsTrigger value="tab2">
        Two
      </TabsTrigger>
      <TabsTrigger value="tab3">
        Three
      </TabsTrigger>
    </TabsList>
    <TabsContent value="tab1">
      Tab one content
    </TabsContent>
    <TabsContent value="tab2">
      Tab two content
    </TabsContent>
    <TabsContent value="tab3">
      Tab three content
    </TabsContent>
  </TabsRoot>
</template>
```

## 无障碍

遵循[选项卡 WAI-ARIA 设计模式](https://www.w3.org/WAI/ARIA/apg/patterns/tabpanel)。

### 键盘交互

<KeyboardTable
  :data="[
    {
      keys: ['Tab'],
      description: '<span>当焦点移动到选项卡上时，将焦点放在活动触发器上。当触发器获得焦点时，将焦点移动到活动内容。</span>',
    },
    {
      keys: ['ArrowDown'],
      description: '<span>根据<Code>orientation</Code>将焦点移动到下一个触发器，并激活其关联的内容。</span>',
    },
    {
      keys: ['ArrowRight'],
      description: '<span>根据<Code>orientation</Code>将焦点移动到下一个触发器，并激活其关联的内容。</span>',
    },
    {
      keys: ['ArrowUp'],
      description: '<span>根据<Code>orientation</Code>将焦点移动到上一个触发器，并激活其关联的内容。</span>',
    },
    {
      keys: ['ArrowLeft'],
      description: '<span>根据<Code>orientation</Code>将焦点移动到上一个触发器，并激活其关联的内容。</span>',
    },
    {
      keys: ['Home'],
      description: '<span>将焦点移动到第一个触发器并激活其关联的内容。</span>',
    },
    {
      keys: ['End'],
      description: '<span>将焦点移至最后一个触发器并激活其关联的内容。</span>',
    },
  ]"
/>
