---
title: Focus Scope 聚焦作用域
description:  通过支持捕获和循环焦点导航来管理组件边界内的焦点。
---

# Focus Scope 聚焦作用域

<Description>
通过支持捕获和循环焦点导航来管理组件边界内的焦点。
</Description>

Focus Scope 增强了对组件边界内键盘焦点管理的控制。它可以将焦点捕获在其容器中，并可选择循环焦点导航，使其成为需要管理焦点状态的模态界面和其他交互式组件的理想选择。

## API 参考

<!-- @include: @/zh/meta/FocusScope.md -->

## 示例

焦点捕获的基本用法

```vue line=2
<template>
  <FocusScope :trapped="true">
    <div>
      <button>Action 1</button>
      <button>Action 2</button>
      <button>Close</button>
    </div>
  </FocusScope>
</template>
```

### 焦点循环

启用捕获和循环以实现完整的焦点管理：

```vue line=2
<template>
  <FocusScope :trapped="true" :loop="true">
    <div>
      <button v-for="item in items" :key="item.id">
        {{ item.label }}
      </button>
    </div>
  </FocusScope>
</template>
```

### 处理聚焦事件

```vue line=2-5
<script setup>
function handleMountFocus(event) {
  // Prevent default auto-focus behavior if needed
  event.preventDefault()
}
</script>

<template>
  <FocusScope
    @mount-auto-focus="handleMountFocus"
    @unmount-auto-focus="handleUnmountFocus"
  >
    <div>
      …
    </div>
  </FocusScope>
</template>
```

<br>

<Callout type="warning">

使用捕获模式时，请确保范围内始终至少有一个可聚焦元素，以防止焦点被困在无法访问的状态。

</Callout>
