<script setup>
// NavigationMenu: N instances of a typical composition (closed/default state)
import { NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuRoot, NavigationMenuTrigger, NavigationMenuViewport } from 'reka-ui'

defineProps({ n: { type: Number, default: 100 } })
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <NavigationMenuRoot>
      <NavigationMenuList>
        <NavigationMenuItem
          v-for="m in ['Learn', 'Overview']"
          :key="m"
        >
          <NavigationMenuTrigger :class="{ trg: m === 'Learn' }">
            {{ m }}
          </NavigationMenuTrigger>
          <NavigationMenuContent class="nm-content">
            <NavigationMenuLink href="#">
              {{ m }} link
            </NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="#">
            Github
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
      <NavigationMenuViewport />
    </NavigationMenuRoot>
  </div>
</template>
