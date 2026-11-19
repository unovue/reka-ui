---
title: useDirection
description: Access the current direction
---

# useDirection

<Description>
Access the current direction
</Description>

## Usage

```ts
import { useDirection } from 'reka-ui'

// With ConfigProvider setup as follows
// <ConfigProvider dir="rtl">
const locale = useDirection() // rtl
```

```ts
import { useDirection } from 'reka-ui'

// With ConfigProvider setup as follows
// <ConfigProvider dir="rtl">
const locale = useDirection('ltr') // ltr
```
