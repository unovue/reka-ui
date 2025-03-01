---
title: useId
description: 生成随机 ID
---

# useId

<Callout type="warning" title="Deprecated">

[Vue 3.5](https://blog.vuejs.org/posts/vue-3-5#useid) 发布了 `useId` 的官方客户端-服务器稳定解决方案。

</Callout>

<Description>
生成随机 ID
</Description>

## Usage

```ts
import { useId } from 'reka-ui'

const buttonId = useId() // reka-1
```

```ts
import { useId } from 'reka-ui'

const buttonId = useId('test-id') // test-id
```
