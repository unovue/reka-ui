<script setup lang="ts">
import { useData } from 'vitepress'
import CardLink from '../components/CardLink.vue'

const { frontmatter } = useData()
</script>

<template>
  <div class="content pb-20 px-4 md:px-0">
    <div class="mx-auto w-full">
      <div class="mt-8 mb-16 md:mt-24 md:mb-24 flex flex-col">
        <h1 class="text-4xl lg:text-5xl font-bold">
          Showcase
        </h1>
        <h2 class="mt-2 md:mt-6 md:text-xl font-medium text-muted-foreground max-w-[640px]">
          {{ frontmatter.description }}
        </h2>

        <a
          class="w-max text-sm mt-4 flex items-center justify-center gap-2 whitespace-nowrap rounded-lg py-2.5 px-4 bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
          target="_blank"
          href="https://github.com/unovue/reka-ui/edit/v2/docs/content/showcase.md"
        >
          Add Showcase
        </a>
      </div>

      <div class="flex flex-col gap-8 md:gap-12">
        <div>
          <h3 class="text-primary md:text-lg font-bold ml-2 inline-flex items-center group">
            Packages
          </h3>
          <div class="mt-4 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CardLink
              v-for="item in frontmatter.packages"
              :key="item.title"
              v-bind="item"
            />
          </div>
        </div>

        <div>
          <h3 class="text-primary md:text-lg font-bold ml-2 inline-flex items-center group">
            Projects
          </h3>
          <div class="mt-4 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CardLink
              v-for="item in frontmatter.projects"
              :key="item.title"
              v-bind="item"
            />
          </div>
        </div>

        <div v-if="frontmatter.starters && frontmatter.starters.length">
          <h3 class="text-primary md:text-lg font-bold ml-2 inline-flex items-center group">
            Starters
          </h3>
          <div class="mt-4 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CardLink
              v-for="item in frontmatter.starters"
              :key="item.title"
              v-bind="item"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
