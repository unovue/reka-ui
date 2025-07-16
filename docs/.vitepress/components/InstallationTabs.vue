<script setup lang="ts">
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from 'reka-ui'
import { PACKAGE_MANAGERS } from '../plugins/InstallationTabs'
import { store } from '../store'
</script>

<template>
  <TabsRoot
    v-model="store.packageManager"
    class="bg-[hsl(141_17%_5%)] border border-[hsl(0_0%_15%)] rounded-xl overflow-hidden"
  >
    <div class="bg-[hsl(141_17%_5%)] border-b border-[hsl(0_0%_15%)] flex pr-2">
      <div class="flex justify-between items-center w-full text-[13px]">
        <TabsList class="flex">
          <TabsTrigger
            v-for="(pkg, index) in PACKAGE_MANAGERS"
            :key="index"
            :value="pkg"
            tabindex="-1"
            class="text-white/70 py-2.5 px-4 data-[state=active]:shadow-[0_1px_0_#10b981] data-[state=active]:font-medium data-[state=active]:text-white hover:text-white"
          >
            {{ pkg }}
          </TabsTrigger>
        </TabsList>
      </div>
    </div>

    <div
      class="[&_>div]:!m-0 custom [&_pre]:rounded-t-none [&_pre]:border-none"
    >
      <TabsContent
        v-for="pkg in PACKAGE_MANAGERS"
        :key="pkg"
        tabindex="-1"
        :value="pkg"
        as-child
      >
        <slot :name="pkg" />
      </TabsContent>
    </div>
  </TabsRoot>
</template>
