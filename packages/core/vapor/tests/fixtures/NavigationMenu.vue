<script setup vapor lang="ts">
import { NavigationMenuContent, NavigationMenuIndicator, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuRoot, NavigationMenuTrigger, NavigationMenuViewport } from '#reka'
import { ref } from 'vue'

const current = ref('')
</script>

<template>
  <NavigationMenuRoot
    id="nav"
    v-model="current"
    :delay-duration="0"
    style="position: relative"
  >
    <NavigationMenuList
      id="nav-list"
      style="display: flex; list-style: none; gap: 8px"
    >
      <NavigationMenuItem value="products">
        <NavigationMenuTrigger id="nav-products">
          Products
        </NavigationMenuTrigger>
        <NavigationMenuContent id="nav-products-content">
          <NavigationMenuLink
            id="nav-link-a"
            href="#a"
          >
            Alpha
          </NavigationMenuLink>
          <NavigationMenuLink
            id="nav-link-b"
            href="#b"
          >
            Bravo
          </NavigationMenuLink>
        </NavigationMenuContent>
      </NavigationMenuItem>
      <NavigationMenuItem value="company">
        <!-- asChild, template form -->
        <NavigationMenuTrigger as-child>
          <button
            id="nav-company"
            data-state="mine"
          >
            Company
          </button>
        </NavigationMenuTrigger>
        <NavigationMenuContent id="nav-company-content">
          <NavigationMenuLink href="#about">
            About
          </NavigationMenuLink>
        </NavigationMenuContent>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <!-- asChild, v-slot form -->
        <!-- @vue-expect-error the slot types don't list `props` yet (see the Vapor guide) -->
        <NavigationMenuLink
          v-slot="{ props }"
          as-child
        >
          <a
            v-bind="props"
            id="nav-docs"
            href="#docs"
          >Docs</a>
        </NavigationMenuLink>
      </NavigationMenuItem>
      <NavigationMenuIndicator id="nav-indicator" />
    </NavigationMenuList>
    <NavigationMenuViewport id="nav-viewport" />
  </NavigationMenuRoot>
  <span id="current">{{ current }}</span>
  <div
    id="away"
    style="height: 60px; margin-top: 200px"
  >
    away
  </div>
</template>
