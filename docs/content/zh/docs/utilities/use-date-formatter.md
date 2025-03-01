---
title: useDateFormatter
description: 围绕 `DateFormatter` 创建一个包装器，它是 Intl.DateTimeFormat API 的改进版本，各种日期生成器在内部使用它来轻松地以一致的方式格式化日期。
---

# useDateFormatter

<Description>

围绕 `DateFormatter` 创建一个包装器，它是 Intl.DateTimeFormat API 的改进版本，各种日期生成器在内部使用它来轻松地以一致的方式格式化日期。

</Description>

有关 DateFormatter 的更多信息[在此](https://react-spectrum.adobe.com/internationalized/date/DateFormatter.html)。

## 用法

```vue
<script setup lang="ts">
import { type Ref, ref } from 'vue'
import { CalendarDate, type DateValue, getLocalTimeZone } from '@internationalized/date'
import { toDate, useDateFormatter } from 'reka-ui'

const value = ref(new CalendarDate(1995, 8, 18)) as Ref<DateValue>
// provide the locale
const formatter = useDateFormatter('en')
</script>

<template>
  <span>
    <!-- output the month in short format. e.g.: Jan, Feb, etc. -->
    {{ formatter.custom(value.toDate(getLocalTimeZone()), { month: 'short' }) }}
  </span>
</template>
```
