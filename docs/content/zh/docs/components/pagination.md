---
title: 分页
description: 以分页格式显示数据，并提供页面之间的导航。
name: 分页
---

# 分页

<Description>
以分页格式显示数据，并提供页面之间的导航。
</Description>

<ComponentPreview name="Pagination" />

## 特性

<Highlights
  :features="[
    '可对第一页或最后一页快速访问',
    '可持续显示边缘，或不显示边缘',
  ]"
/>

## 安装

从命令行安装组件。

<InstallationTabs value="reka-ui" />

### 组件解析

导入所有零件并将它们拼凑在一起。

```vue
<script setup>
import { PaginationEllipsis, PaginationFirst, PaginationLast, PaginationList, PaginationListItem, PaginationNext, PaginationPrev, PaginationRoot } from 'reka-ui'
</script>

<template>
  <PaginationRoot>
    <PaginationList v-slot="{ items }">
      <PaginationFirst />
      <PaginationPrev />
      <template v-for="(page, index) in items">
        <PaginationListItem
          v-if="page.type === 'page'"
          :key="index"
        />
        <PaginationEllipsis
          v-else
          :key="page.type"
          :index="index"
        >
          &#8230;
        </PaginationEllipsis>
      </template>
      <PaginationNext />
      <PaginationLast />
    </PaginationList>
  </PaginationRoot>
</template>
```

## API 参考

### Root

包含所有分页部件。

<!-- @include: @/zh/meta/PaginationRoot.md -->

### List

用于显示页面列表。它还使辅助技术可以访问分页。

<!-- @include: @/zh/meta/PaginationList.md -->

### Item

用于呈现更改当前页面的按钮。

<!-- @include: @/zh/meta/PaginationItem.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-selected]',
      values: ['true' , ''],
    },
    {
      attribute: '[data-type]',
      values: ['page'],
    }
  ]"
/>

### Ellipsis

占位元素，当列表很长，并且只设置了少量的 `siblingCount` 并且 `showEdges` 设置为 `true` 时。

<!-- @include: @/zh/meta/PaginationEllipsis.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-type]',
      values: ['ellipsis'],
    }
  ]"
/>

### First

将页面值设置为 1 的触发器

<!-- @include: @/zh/meta/PaginationFirst.md -->

### Prev

将页面值设置为上一页的触发器

<!-- @include: @/zh/meta/PaginationPrev.md -->

### Next

将页面值设置为下一页的触发器

<!-- @include: @/zh/meta/PaginationNext.md -->

### Last

将页面值设置为最后一页的触发器

<!-- @include: @/zh/meta/PaginationLast.md -->

## 示例

### 省略

您可以添加 `PaginationEllipsis` 作为更多前一项或后一项的视觉提示。

```vue line=10-12
<script setup lang="ts">
import { PaginationEllipsis, PaginationList, PaginationListItem, PaginationRoot } from 'reka-ui'
</script>

<template>
  <PaginationRoot>
    <PaginationList v-slot="{ items }">
      <template v-for="(page, index) in items">
        <PaginationListItem
          v-if="page.type === 'page'"
          :key="index"
        />
        <PaginationEllipsis
          v-else
          :key="page.type"
          :index="index"
        >
          &#8230;
        </PaginationEllipsis>
      </template>
    </PaginationList>
  </PaginationRoot>
</template>
```

### 第一页和最后一页按钮

您可以添加 `PaginationFirst` 以允许用户导航到第一页，或添加 `PaginationLast` 以导航到最后一页。

```vue line=8,10
<script setup lang="ts">
import { PaginationFirst, PaginationLast, PaginationList, PaginationListItem, PaginationRoot } from 'reka-ui'
</script>

<template>
  <PaginationRoot>
    <PaginationList>
      <PaginationFirst />
      ...
      <PaginationLast />
    </PaginationList>
  </PaginationRoot>
</template>
```

### 以程序方式控制页面

您可以通过向当前页面传递一个响应值来控制当前页面。

```vue line=6,10,11
<script setup lang="ts">
import { PaginationRoot } from 'reka-ui'
import { Select } from './custom-select'
import { ref } from 'vue'

const currentPage = ref(1)
</script>

<template>
  <Select v-model="currentPage" />
  <PaginationRoot v-model:page="currentPage">
    ...
  </PaginationRoot>
</template>
```

## Keyboard Interactions

<KeyboardTable
  :data="[
    {
      keys: ['Tab'],
      description: '将焦点移动到下一个可聚焦元素。',
    },
    {
      keys: ['Space'],
      description: `
        <span>
          当焦点位于任何触发器上时，触发所选页面或箭头导航
        </span>`
    },
    {
      keys: ['Enter'],
      description:  `
        <span>
          当焦点位于任何触发器上时，触发所选页面或箭头导航
        </span>`
    },
  ]"
/>
