---
title: 迁移 - 从 Radix Vue 到 Reka UI
description: 本指南为开发人员提供了将项目从 Radix Vue 过渡到 Reka UI 的分步说明。
---

# 迁移 - 从 Radix Vue 到 Reka UI

<Description>
本指南为开发人员提供了将项目从 Radix Vue 过渡到 Reka UI 的分步说明。
</Description>

## 安装

首先，您需要安装最新的 `reka-ui`。

<InstallationTabs value="reka-ui" />

祝贺！🎉 现在您已经安装了上述软件包，让我们执行迁移！前 2 个步骤相对简单。只需对以下更改进行全局搜索和替换即可。

## 导入语句更改

导入的主要变化是将 `radix-vue` 替换为 `reka-ui`。

```vue
<script setup lang="ts">
import { TooltipPortal, TooltipRoot, TooltipTrigger } from 'radix-vue' // [!code --]
import { TooltipPortal, TooltipRoot, TooltipTrigger } from 'reka-ui' // [!code ++]
</script>
```

## 命名约定更改

CSS 变量和数据属性名称已更新为使用 `reka` 前缀而不是 `radix`。

```css
  --radix-accordion-content-width: 300px; /* [!code --] */
  --reka-accordion-content-width: 300px; /* [!code ++] */

  [data-radix-collection-item] {} /* [!code --] */
  [data-reka-collection-item] {} /* [!code ++] */
```

## 组件重大更改

### Combobox 组合框

- [删除 `filter-function` 属性](https://github.com/unovue/reka-ui/commit/ee8a3f2366a5c27c2bf1cc0a1ecbb0fea559a9f7) - `Combobox` 已重构和改进，以支持更好的自定义筛选。阅读更多。
  ```vue
  <template>
    <ComboboxRoot :filter-function="customFilter" />  <!-- [!code --] -->
  </template>
  ```

- [将 Root 的 `searchTerm` props 替换为 Input 的 `v-model`](https://github.com/unovue/reka-ui/commit/e1bab6598c3533dfbf6a86ad26b471ab826df069#diff-833593a5ce28a8c3fabc7d77462b116405e25df2b93bcab449798b5799e73474)
- [将 `displayValue` props 从 Root 移动到 Input](https://github.com/unovue/reka-ui/commit/e1bab6598c3533dfbf6a86ad26b471ab826df069#diff-833593a5ce28a8c3fabc7d77462b116405e25df2b93bcab449798b5799e73474)

  ```vue
  <template>
    <ComboboxRoot v-model:search-term="search" :display-value="(v) => v.name" /> <!-- [!code --] -->
    <ComboboxRoot>
      <ComboboxInput v-model="search" :display-value="(v) => v.name" /> <!-- [!code ++] -->
    </ComboboxRoot>
  </template>
  ```

### Arrow 箭头

- [改进箭头多边形](https://github.com/unovue/reka-ui/commit/ac8f3c34760f4c9c0f952ecd027b32951b9c416c) - 更改 svg 多边形以允许更好的样式。

### Form component 表单组件

- [将受控状态重命名为 `v-model`](https://github.com/unovue/reka-ui/commit/87aa5ba6016fa7a98f02ea43062212906b2633a0) -  将 `v-model:checked`、`v-model:pressed` 替换为更熟悉的表单组件 API。

  ```vue
  <template>
    <CheckboxRoot v-model:checked="value" /> <!-- [!code --] -->
    <CheckboxRoot v-model="value" /> <!-- [!code ++] -->
  </template>
  ```

- [重新定位 `VisuallyHidden`](https://github.com/unovue/reka-ui/commit/107389a9c230d2c94232887b9cbe2710222564aa) - 以前，`VisuallyHidden` 位于根节点处，导致范围限定的样式无效。

### Menu CheckboxItem 菜单复选框项

- 与表单组件中的更改类似，用于绑定 `CheckboxItem` 的 API 已从 `v-model:checked` 更改为 `v-model`。

  ```vue
  <template>
    <DropdownMenuCheckboxItem v-model:checked="value" /> <!-- [!code --] -->
    <DropdownMenuCheckboxItem v-model="value" />

    <DropdownMenuCheckboxItem checked /> <!-- [!code --] -->
    <DropdownMenuCheckboxItem :model-value="true" />
  </template>
  ```

### Pagination 分页

- [必需的 `itemsPerPage` 属性](https://github.com/unovue/reka-ui/commit/37bba0c26a3cbe7e7e3e4ac36770be3ef5224f0c) - 现在需要提供有关页面大小的更明确提示，而不是默认的 `itemsPerPage` 值。

  ```vue
  <template>
    <PaginationRoot :items-per-page="10" />  <!-- [!code ++] -->
  </template>
  ```

### Calendar 日历

- [删除已弃用的 step prop ](https://github.com/unovue/reka-ui/commit/ec146dd8fa0f95f64baf0b29c3424ee31cfb9666) - 使用 `prevPage/nextPage` props 进行更好的控制。

  ```vue
  <script setup lang="ts">
  function pagingFunc(date: DateValue, sign: -1 | 1) { // [!code ++]
    if (sign === -1) // [!code ++]
      return date.subtract({ years: 1 }) // [!code ++]
    return date.add({ years: 1 }) // [!code ++]
  } // [!code ++]
  </script>

  <template>
    <CalendarPrev step="year" /> <!-- [!code --] -->
    <CalendarPrev :prev-page="(date: DateValue) => pagingFunc(date, -1)" /> <!-- [!code ++] -->

    <CalendarNext step="year" /> <!-- [!code --] -->
    <CalendarNext :next-page="(date: DateValue) => pagingFunc(date, 1)" /> <!-- [!code ++] -->
  </template>
  ```

### Select 选择

- [`SelectValue` 不再渲染传送元素](https://github.com/unovue/reka-ui/commit/6a623484d610cc3b7c1a23a77c253c8e95cef518) - 以前实现 `SelectValue` 将通过传送片段渲染选定的 `SelectItem`。这会导致 SSR 闪烁，并且是不必要的计算。

  ```vue
  <template>
    <SelectValue>
      <!-- render the content similar to `SelectItem` --> <!-- [!code ++] -->
    </SelectValue>
  </template>
  ```

### Presence 存在

为了更好地支持 SSR 内容，我们还修改了使用 Presence 的组件使用 `forceMount` 的逻辑：

- `Accordion`
- `Collapsible`
- `Tabs`
- `NavigationMenu`

[`forceMount` 现在将渲染组件](https://github.com/unovue/reka-ui/commit/6f7f29abe79ac6c3ace117a398b6f7613ab6d2bc)，即使 state 处于 inactive。现在，您需要手动处理组件的可见性逻辑。

  ```vue
  <template>
    <TabsRoot
      v-slot="{ modelValue }"
      default-value="tab1"
    >
      <TabsContent
        value="tab1"
        force-mount
        :hidden="modelValue !== 'tab1'"
      >
        …
      </TabsContent>
      <TabsContent
        value="tab2"
        force-mount
        :hidden="modelValue !== 'tab2'"
      >
        …
      </TabsContent>
    </TabsRoot>
  </template>
  ```
