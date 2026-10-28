<script setup>
// Tabs: N instances of a typical composition (closed/default state)
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from 'reka-ui'

defineProps({ n: { type: Number, default: 100 } })
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <TabsRoot default-value="t1">
      <TabsList>
        <TabsTrigger
          v-for="t in ['t1', 't2', 't3']"
          :key="t"
          :value="t"
        >
          {{ t }}
        </TabsTrigger>
      </TabsList>
      <TabsContent
        v-for="t in ['t1', 't2', 't3']"
        :key="t"
        :value="t"
      >
        Panel {{ t }}
      </TabsContent>
    </TabsRoot>
  </div>
</template>
