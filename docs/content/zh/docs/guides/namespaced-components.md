# 命名空间组件

Reka UI 设计模式是为每个组件创建 primitives，并允许用户随心所欲地构建或[组合](./composition)组件。

但是，逐个导入所有必要的组件可能非常费力，用户有时可能会不小心遗漏一个重要的组件。

## 如何使用？

首先，你需要在 Vue 组件中通过 `reka-ui/namespaced` 导入命名空间组件。

```vue line=2
<script setup lang="ts">
import { Dialog, DropdownMenu } from 'reka-ui/namespaced'
</script>
```

然后，您可以使用命名空间中的所有相关组件。

```vue line=6-17
<script setup lang="ts">
import { Dialog } from 'reka-ui/namespaced'
</script>

<template>
  <Dialog.Root>
    <Dialog.Trigger>
      Trigger
    </Dialog.Trigger>
  </Dialog.Root>

  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content>
      …
    </Dialog.Content>
  </Dialog.Portal>
</template>
```
