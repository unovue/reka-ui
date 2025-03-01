---

title: Tree
description: 树视图显示项目的分层列表，这些项目可以展开或折叠以显示或隐藏其子项目，例如在文件系统导航器中。
name: tree
aria: https://www.w3.org/WAI/ARIA/apg/patterns/treeview/
---

# Tree

<Badge>Alpha</Badge>

<Description>
树视图显示项目的分层列表，这些项目可以展开或折叠以显示或隐藏其子项目，例如在文件系统导航器中。
</Description>

<ComponentPreview name="Tree" />

## 特性

<Highlights
  :features="[
    '可以是受控的或非受控的',
    '焦点完全可控',
    '全键盘导航',
    '支持从右到左的方向（RTL）',
    '支持多选',
    '不同的选择行为',
  ]"
/>

## 安装

从命令行安装组件。

<InstallationTabs value="reka-ui" />

## 组件解析

导入所有零件并将它们拼凑在一起。

```vue
<script setup>
import { TreeItem, TreeRoot, TreeVirtualizer } from 'reka-ui'
</script>

<template>
  <TreeRoot>
    <TreeItem />

    <!-- or with virtual -->
    <TreeVirtualizer>
      <TreeItem />
    </TreeVirtualizer>
  </TreeRoot>
</template>
```

## API 参考

### Root

包含树的所有部分。

<!-- @include: @/zh/meta/TreeRoot.md -->

### Item

项组件。

<!-- @include: @/zh/meta/TreeItem.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-indent]',
      values: 'Number',
    },
    {
      attribute: '[data-expanded]',
      values: 'Present when expanded',
    },
    {
      attribute: '[data-selected]',
      values: '选中时存在',
    },
  ]"
/>

### Virtualizer

虚拟容器，实现列表虚拟化。

<!-- @include: @/zh/meta/TreeVirtualizer.md -->

## 示例

### 选择多个项

`Tree` 组件允许您选择多个项目。您可以通过提供值数组而不是单个值并设置 `multiple="true"` 来启用此功能。

```vue line=12,16
<script setup lang="ts">
import { ref } from 'vue'
import { TreeRoot } from 'reka-ui'

const people = [
  { id: 1, name: 'Durward Reynolds' },
  { id: 2, name: 'Kenton Towne' },
  { id: 3, name: 'Therese Wunsch' },
  { id: 4, name: 'Benedict Kessler' },
  { id: 5, name: 'Katelyn Rohan' },
]
const selectedPeople = ref([people[0], people[1]])
</script>

<template>
  <TreeRoot
    v-model="selectedPeople"
    multiple
  >
    ...
  </TreeRoot>
</template>
```

### 虚拟列表

渲染一长串项目可能会降低应用程序的速度，因此使用虚拟化将显著提高性能。

```vue line=9-16
<script setup lang="ts">
import { ref } from 'vue'
import { TreeItem, TreeRoot, TreeVirtualizer } from 'reka-ui'
</script>

<template>
  <TreeRoot :items>
    <!-- checkout https://reka-ui.com/components/tree.html#virtualizer -->
    <TreeVirtualizer
      v-slot="{ item }"
      :text-content="(opt) => opt.name"
    >
      <TreeItem v-bind="item.bind">
        {{ person.name }}
      </TreeItem>
    </TreeVirtualizer>
  </TreeRoot>
</template>
```

### 带复选框

某些 `Tree` 组件可能希望显示 `toggled/indeterminate` 复选框。我们可以通过使用一些 props 和 `preventDefault` 事件来改变 `Tree` 组件的行为。

我们将 `propagateSelect` 设置为 `true`，因为我们希望父复选框选择/取消选择它的后代。然后，我们添加一个触发 `select` 事件的复选框。

```vue line=10-11,17-25,29-33
<script setup lang="ts">
import { ref } from 'vue'
import { TreeItem, TreeRoot } from 'reka-ui'
</script>

<template>
  <TreeRoot
    v-slot="{ flattenItems }"
    :items
    multiple
    propagate-select
  >
    <TreeItem
      v-for="item in flattenItems"
      :key="item._id"
      v-bind="item.bind"
      v-slot="{ handleSelect, isSelected, isIndeterminate }"
      @select="(event) => {
        if (event.detail.originalEvent.type === 'click')
          event.preventDefault()
      }"
      @toggle="(event) => {
        if (event.detail.originalEvent.type === 'keydown')
          event.preventDefault()
      }"
    >
      <Icon
        v-if="item.hasChildren"
        icon="radix-icons:chevron-down"
      />

      <button
        tabindex="-1"
        @click.stop
        @change="handleSelect"
      >
        <Icon
          v-if="isSelected"
          icon="radix-icons:check"
        />
        <Icon
          v-else-if="isIndeterminate"
          icon="radix-icons:dash"
        />
        <Icon
          v-else
          icon="radix-icons:box"
        />
      </button>

      <div class="pl-2">
        {{ item.value.title }}
      </div>
    </TreeItem>
  </TreeRoot>
</template>
```

### 嵌套树节点

默认示例显示了扁平化的树项目和节点，这使得[虚拟化](/zh/docs/components/tree.html#virtual-list)和自定义功能（如拖放）更容易。但是，您也可以将其构建为具有嵌套的 DOM 节点。

在 `Tree.vue` 中，

```vue
<script setup lang="ts">
import { TreeItem } from 'reka-ui'

interface TreeNode {
  title: string
  icon: string
  children?: TreeNode[]
}

withDefaults(defineProps<{
  treeItems: TreeNode[]
  level?: number
}>(), { level: 0 })
</script>

<template>
  <li
    v-for=" tree in treeItems"
    :key="tree.title"
  >
    <TreeItem
      v-slot="{ isExpanded }"
      as-child
      :level="level"
      :value="tree"
    >
      <button>…</button>

      <ul v-if="isExpanded && tree.children">
        <Tree
          :tree-items="tree.children"
          :level="level + 1"
        />
      </ul>
    </TreeItem>
  </li>
</template>
```

在 `CustomTree.vue` 中，

```vue
<template>
  <TreeRoot
    :items="items"
    :get-key="(item) => item.title"
  >
    <Tree :tree-items="items" />
  </TreeRoot>
</template>
```

### 自定义子架构

默认情况下，`<TreeRoot />` 希望您通过为每个节点传递 `children` 项列表来提供节点的子项列表。您可以通过提供 `getChildren` 属性来覆盖它。

<Callout type="info">

如果节点没有任何子节点，`getChildren` 应返回 `undefined` 而不是空数组。

</Callout>

```vue line=22
<script setup lang="ts">
import { ref } from 'vue'
import { TreeRoot } from 'reka-ui'

interface FileNode {
  title: string
  icon: string
}

interface DirectoryNode {
  title: string
  icon: string
  directories?: DirectoryNode[]
  files?: FileNode[]
}
</script>

<template>
  <TreeRoot
    :items="items"
    :get-key="(item) => item.title"
    :get-children="(item) => (!item.files) ? item.directories : (!item.directories) ? item.files : [...item.directories, ...item.files]"
  >
    ...
  </TreeRoot>
</template>
```

### 可拖动/可排序树

对于更复杂的可拖动 `Tree` 组件，在这个例子中，我们将使用 [pragmatic-drag-and-drop](https://github.com/atlassian/pragmatic-drag-and-drop) 作为处理 dnd 的核心包。

[Stackblitz 演示](https://stackblitz.com/edit/github-8f3fzs?file=src%2FTreeDND.vue)

## 无障碍

遵循 [Tree WAI-ARIA 设计模式](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/)。

### 键盘交互

<KeyboardTable
  :data="[
    {
      keys: ['Enter'],
      description: '在<code>TreeItem</code>上高亮显示时，选择聚焦的项目。',
    },
    {
      keys: ['ArrowDown'],
      description: '当焦点位于 <code>TreeItem</code> 上时，将焦点移至下一项。',
    },
    {
      keys: ['ArrowUp'],
      description: '当焦点位于<code>TreeItem</code>上时，将焦点移动到上一项。',
    },
    {
      keys: ['ArrowRight'],
      description: '当焦点位于已关闭的<code>TreeItem</code>（节点）上时，它会在不移动焦点的情况下打开该节点。在打开的节点上时，它会将焦点移动到第一个子节点。当位于终端节点上时，它不执行任何动作。',
    },
    {
      keys: ['ArrowLeft'],
      description: '当焦点位于打开的 <code>TreeItem</code>（节点）上时，关闭该节点。当焦点位于同时是结束节点或闭合节点的子节点上时，将焦点移动到其父节点。当焦点位于根节点上时，该根节点也是结束节点或闭合节点，则不执行任何动作。',
    },
    {
      keys: ['Home', 'PageUp'],
      description: '<span>将焦点移动到第一个 <code>TreeItem</code></span>',
    },
    {
      keys: ['End', 'PageDown'],
      description: '<span>将焦点移动到最后一个 <code>TreeItem</code></span>',
    },
  ]"
/>
