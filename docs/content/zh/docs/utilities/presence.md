---
title: Presence
description: 通过过渡支持管理元素的挂载和取消挂载。
---

# Presence

<Description>
通过过渡支持管理元素的挂载和取消挂载。
</Description>

<Callout type="info" title="问题">

这个组件和 [Vue Transition](https://cn.vuejs.org/guide/built-ins/transition.html#transition) 有什么不同？

A： 最大的区别是它接受 css 动画，并控制元素的可见性。

</Callout>

Presence 组件增强了对元素安装/卸载的控制。它确保在从 DOM 中删除元素之前完成动画和过渡，使其非常适合动画 UI 组件。

## API 参考

<PropsTable :data="[
  {
    'name': 'present',
    'description': '<p>有条件地挂载或卸载子元素。类似于 <code>v-if</code></p>\n',
    'type': 'boolean',
    'required': true,
  },
  {
    'name': 'forceMount',
    'description': '<p>强制元素始终呈现。用于以程序方式呈现具有公开 <code>present</code> 的孙组件</p>\n',
    'type': 'boolean',
    'required': false,
    'default': false
  },
]" />

<EmitsTable :data="[
  {
    'name': 'enter',
    'description': '<p>当进入动画开始时调用的事件处理程序</p>\n',
    'type': 'CustomEvent'
  },
  {
    'name': 'after-enter',
    'description': '<p>当 enter 动画完成时调用的事件处理程序</p>\n',
    'type': 'CustomEvent'
  },
  {
    'name': 'leave',
    'description': '<p>离开动画开始时调用的事件处理程序</p>\n',
    'type': 'CustomEvent'
  },
  {
    'name': 'after-leave',
    'description': '<p>离开动画完成时调用的事件处理程序</p>\n',
    'type': 'CustomEvent'
  },
]" />

<Callout type="tip">

阅读我们的[动画指南](/zh/docs/guides/animation)，了解有关使用 Presence 组件实现动画的更多信息。

</Callout>

## 示例

```vue line=2,4,5
<template>
  <Presence :present="isVisible">
    <div
      :data-open="isVisible ? 'open' : 'close'"
      class="data-[state=open]:animate-fadeIn data-[state=closed]:animate-fadeOut"
    >
      <slot />
    </div>
  </Presence>
</template>
```

### Force Mount

当您需要确保无论当前状态如何都始终呈现内容时：

```vue
<template>
  <Presence v-slot="{ present }" :present="isVisible" :force-mount="true">
    <div>
      This content will always be rendered

      <div v-if="present">
        This content is hidden
      </div>
    </div>
  </Presence>
</template>
```
