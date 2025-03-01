---
title: useFilter
description: 语言敏感（Locale-Aware）字符串筛选
---

# useFilter

<Description>
语言敏感（Locale-Aware）字符串筛选
</Description>

`useFilter` 提供了使用 Intl.Collator 执行语言敏感字符串过滤的 Util 函数。它确保正确的 Unicode 处理，并允许通过 Intl.CollatorOptions 进行自定义。

## 选项

您可以使用 `Intl.CollatorOptions` 自定义行为。有关更多详细信息，请参阅 [MDN 文档](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Intl/Collator/Collator#options)。

```ts
const { startsWith } = useFilter({ sensitivity: 'base' })
console.log(startsWith('Résumé', 'resume')) // true (case-insensitive)
```

## 用法

### 示例用法

```ts
import { useFilter } from 'reka-ui'

const { startsWith, endsWith, contains } = useFilter()

console.log(startsWith('hello', 'he')) // true
console.log(endsWith('hello', 'lo')) // true
console.log(contains('hello', 'ell')) // true
```

## 在 Vue 组件中使用 `useFilter`

```vue
<script setup>
import { ref } from 'vue'
import { useFilter } from '@/composables/useFilter'

const { contains } = useFilter()
const searchQuery = ref('')
const items = ref(['Apple', 'Banana', 'Cherry', 'Date'])

const filteredItems = computed(() =>
  items.value.filter(item => contains(item, searchQuery.value))
)
</script>

<template>
  <div>
    <input v-model="searchQuery" placeholder="Search...">
    <ul>
      <li v-for="item in filteredItems" :key="item">
        {{ item }}
      </li>
    </ul>
  </div>
</template>
```
