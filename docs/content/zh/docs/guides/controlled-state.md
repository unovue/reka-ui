---
title: 受控状态
description: 如何在 Reka UI 中处理受控状态与非受控状态。
---

# 受控状态

<Description>
如何在 Reka UI 中处理受控状态与非受控状态。
</Description>

Reka UI 为组件提供灵活的状态管理，允许开发人员使用**受控**或**非受控**状态。了解何时使用每种方法可以更好地与 Vue 的响应式系统集成。

---

## 受控 vs. 非受控状态

### 受控状态
**受控**组件将其状态作为 prop 接收，并需要通过事件侦听器进行显式更新。父组件管理和同步状态。

#### 示例：受控 `SwitchRoot`

```vue
<script setup>
import { ref } from 'vue'
import { SwitchRoot, SwitchThumb } from 'reka-ui'

const isActive = ref(false)

function handleUpdate(value) {
  isActive.value = value
}
</script>

<template>
  <SwitchRoot :model-value="isActive" @update:model-value="handleUpdate">
    <SwitchThumb />
  </SwitchRoot>
</template>
```

**运作方式：**
- `SwitchRoot` 组件的状态由 `isActive` ref 管理。
- `@update:modelValue` 事件可确保更新正确传播。

<Callout type="tip" title="在以下情况下使用受控状态：">

- 你需要与 Vuex、Pinia 或 API 同步状态。
- 多个组件依赖于相同的状态。
- 您希望对更新进行精细控制。

</Callout>

#### 将 v-model 与受控组件一起使用

Vue 的 `v-model` 语法提供了一种将值绑定到 Reka UI 中受控组件的便捷方法。它会自动处理传递值和侦听更新。

示例：将 `v-model` 与 `SwitchRoot` 结合使用

```vue
<script setup>
import { ref } from 'vue'
import { SwitchRoot, SwitchThumb } from 'reka-ui'

const isActive = ref(false)
</script>

<template>
  <SwitchRoot v-model="isActive">
    <SwitchThumb />
  </SwitchRoot>
</template>
```

### 不受控状态
**uncontrolled** 组件在内部管理自己的 state，不需要 parent-controlled 的 prop。Reka UI 组件使用 `defaultValue` 来初始化状态，而不是 `modelValue`。

#### 示例：不受控 `SwitchRoot`
```vue
<template>
  <SwitchRoot default-value="true">
    <SwitchThumb />
  </SwitchRoot>
</template>
```

**运作方式：**
- `SwitchRoot` 使用 `defaultValue` 初始化其状态。
- 状态更改在内部发生，无需外部控制。

<Callout type="tip" title="在以下情况下使用不受控制的状态：">

- 该组件不需要与外部逻辑同步。
- 你想要一个没有显式状态管理的更简单的设置。
- 该状态是本地状态，不会影响其他组件。

</Callout>

## 常见错误和修复

### 1. 忘记 `@update:modelValue`

```vue
<!-- ❌ 错误：-->
<SwitchRoot :modelValue="isActive" />

<!-- ✅ 正确：-->
<SwitchRoot :modelValue="isActive" @update:modelValue="(val) => isActive = val" />
```

### 2. 使用 `modelValue` 而不是 `defaultValue`

```vue
<!-- ❌ 错误：-->
<SwitchRoot :modelValue="true" />

<!-- ✅ 正确：-->
<SwitchRoot defaultValue="true" />
```

### 3. 不为 computed props 提供 Setter

```ts
// ❌ 错误：
const isActive = computed(() => store.state.toggleState)

// ✅ 错误：
const isActive = computed({
  get: () => store.state.toggleState,
  set: val => store.commit('setToggleState', val)
})
```
