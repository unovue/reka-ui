<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref } from 'vue'
import {
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuRoot,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from 'reka-ui'
import './styles.css'

import NavigationMenuListItem from './NavigationMenuListItem.vue'

const currentTrigger = ref('')
</script>

<template>
  <NavigationMenuRoot
    v-model="currentTrigger"
    class="NavigationMenuRoot"
  >
    <NavigationMenuList class="NavigationMenuList">
      <NavigationMenuItem>
        <NavigationMenuTrigger
          class="NavigationMenuTrigger"
        >
          Learn
          <Icon
            icon="radix-icons:caret-down"
            class="CaretDown"
          />
        </NavigationMenuTrigger>
        <NavigationMenuContent
          class="NavigationMenuContent"
        >
          <ul class="List one">
            <li :style="{ gridRow: 'span 3' }">
              <NavigationMenuLink as-child>
                <a
                  class="Callout"
                  href="/"
                >
                  <img src="https://reka-ui.com/logo.svg">
                  <div class="CalloutHeading">Reka UI</div>
                  <p class="CalloutText">Unstyled, accessible components for Vue.</p>
                </a>
              </NavigationMenuLink>
            </li>

            <NavigationMenuListItem
              href="https://stitches.dev/"
              title="Stitches"
            >
              CSS-in-JS with best-in-class developer experience.
            </NavigationMenuListItem>
            <NavigationMenuListItem
              href="/colors"
              title="Colors"
            >
              Beautiful, thought-out palettes with auto dark mode.
            </NavigationMenuListItem>
            <NavigationMenuListItem
              href="https://lucide.dev/icons/"
              title="Icons"
            >
              A crisp set of 15x15 icons, balanced and consistent.
            </NavigationMenuListItem>
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>

      <NavigationMenuItem>
        <NavigationMenuTrigger
          class="NavigationMenuTrigger"
        >
          Overview
          <Icon
            icon="radix-icons:caret-down"
            class="CaretDown"
          />
        </NavigationMenuTrigger>
        <NavigationMenuContent class="NavigationMenuContent">
          <ul class="List two">
            <NavigationMenuListItem
              title="Introduction"
              href="/docs/primitives/overview/introduction"
            >
              Build high-quality, accessible design systems and web apps.
            </NavigationMenuListItem>
            <NavigationMenuListItem
              title="Getting started"
              href="/docs/primitives/overview/getting-started"
            >
              A quick tutorial to get you up and running with Reka UI.
            </NavigationMenuListItem>
            <NavigationMenuListItem
              title="Styling"
              href="/docs/primitives/guides/styling"
            >
              Unstyled and compatible with any styling solution.
            </NavigationMenuListItem>
            <NavigationMenuListItem
              title="Animation"
              href="/docs/primitives/guides/animation"
            >
              Use CSS keyframes or any animation library of your choice.
            </NavigationMenuListItem>
            <NavigationMenuListItem
              title="Accessibility"
              href="/docs/primitives/overview/accessibility"
            >
              Tested in a range of browsers and assistive technologies.
            </NavigationMenuListItem>
            <NavigationMenuListItem
              title="Releases"
              href="/docs/primitives/overview/releases"
            >
              Reka UI releases and their changelogs.
            </NavigationMenuListItem>
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>

      <NavigationMenuItem>
        <NavigationMenuLink
          class="NavigationMenuLink"
          href="https://github.com/unovue/reka-ui"
        >
          Github
        </NavigationMenuLink>
      </NavigationMenuItem>

      <NavigationMenuIndicator
        class="NavigationMenuIndicator"
      >
        <div class="Arrow" />
      </NavigationMenuIndicator>
    </NavigationMenuList>

    <div class="ViewportPosition">
      <NavigationMenuViewport
        class="NavigationMenuViewport"
      />
    </div>
  </NavigationMenuRoot>
</template>
