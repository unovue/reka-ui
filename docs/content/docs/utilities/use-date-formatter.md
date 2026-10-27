---
title: useDateFormatter
description: A cached wrapper around Intl.DateTimeFormat that formats Temporal values and Dates the way the date components do.
---

# useDateFormatter

<Description>
A cached wrapper around Intl.DateTimeFormat that formats Temporal values and Dates the way the date components do.
</Description>

The formatter accepts a `Temporal.PlainDate`, `Temporal.PlainDateTime`, `Temporal.ZonedDateTime`, `Temporal.PlainTime` or a `Date`:

- A plain value is formatted as its own fields, whatever the user's time zone.
- A `ZonedDateTime` is formatted in its own time zone.
- A value in a non-ISO calendar (`hebrew`, `japanese`, …) is formatted in that calendar.

## Usage

```vue
<script setup lang="ts">
import type { DateValue } from 'reka-ui'
import { useDateFormatter } from 'reka-ui'
import { shallowRef } from 'vue'

const value = shallowRef<DateValue>(new Temporal.PlainDate(1995, 8, 18))
// provide the locale
const formatter = useDateFormatter('en')
</script>

<template>
  <span>
    <!-- output the month in short format. e.g.: Jan, Feb, etc. -->
    {{ formatter.custom(value, { month: 'short' }) }}
  </span>
</template>
```
