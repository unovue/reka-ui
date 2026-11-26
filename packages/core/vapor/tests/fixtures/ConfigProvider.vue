<script setup vapor lang="ts">
import { ConfigProvider, DialogContent, DialogPortal, DialogRoot, DialogTitle, DialogTrigger, TabsContent, TabsList, TabsRoot, TabsTrigger } from '#reka'
import { ref } from 'vue'

const tab = ref('one')
let n = 0
const useId = () => `cfg-${++n}`
defineExpose({ tab })
</script>

<template>
  <div id="portal-target" />
  <ConfigProvider
    dir="rtl"
    :use-id="useId"
    teleport-to="#portal-target"
  >
    <!-- arrow keys select, as the test drives them (v3 defaults to manual activation) -->
    <TabsRoot
      id="tabs"
      v-model="tab"
      activation-mode="automatic"
    >
      <TabsList aria-label="Settings">
        <TabsTrigger
          id="tab-one"
          value="one"
        >
          One
        </TabsTrigger>
        <TabsTrigger
          id="tab-two"
          value="two"
        >
          Two
        </TabsTrigger>
      </TabsList>
      <TabsContent value="one">
        First
      </TabsContent>
      <TabsContent value="two">
        Second
      </TabsContent>
    </TabsRoot>
    <DialogRoot>
      <DialogTrigger id="dialog-trigger">
        Open
      </DialogTrigger>
      <DialogPortal>
        <DialogContent
          id="dialog-content"
          aria-describedby=""
        >
          <DialogTitle>Settings</DialogTitle>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </ConfigProvider>
</template>
