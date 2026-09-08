---
title: useDateFormatter
description: Creates a wrapper around the `DateFormatter`, which is an improved version of the Intl.DateTimeFormat API, that is used internally by the various date builders to easily format dates in a consistent way.
---

# useDateFormatter

<Description>
Creates a wrapper around the `DateFormatter`, which is an improved version of the Intl.DateTimeFormat API, that is used internally by the various date builders to easily format dates in a consistent way.
</Description>

`useDateFormatter` wraps `Intl.DateTimeFormat` with a stable API used across Reka UI date components.

## Usage

```vue
<script setup lang="ts">
import type { TemporalDate } from 'reka-ui'
import type { Ref } from 'vue'
import { useDateFormatter } from 'reka-ui'
import { toDate } from 'reka-ui/date'
import { Temporal } from 'temporal-polyfill'
import { ref } from 'vue'

const value = ref(Temporal.PlainDate.from({ year: 1995, month: 8, day: 18 })) as Ref<TemporalDate>
// provide the locale
const formatter = useDateFormatter('en')
</script>

<template>
  <span>
    <!-- output the month in short format. e.g.: Jan, Feb, etc. -->
    {{ formatter.custom(toDate(value), { month: 'short' }) }}
  </span>
</template>
```
