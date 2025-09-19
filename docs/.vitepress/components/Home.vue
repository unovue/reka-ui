<script setup lang="ts">
import { Icon } from '@iconify/vue'
import AccordionDemo from '../../components/demo/Accordion/tailwind/index.vue'
import CalendarDemo from '../../components/demo/Calendar/tailwind/index.vue'
import HoverCardDemo from '../../components/demo/HoverCard/tailwind/index.vue'
import NumberFieldDemo from '../../components/demo/NumberField/tailwind/index.vue'
import PinInputDemo from '../../components/demo/PinInput/tailwind/index.vue'
import ProgressDemo from '../../components/demo/Progress/tailwind/index.vue'
import SelectDemo from '../../components/demo/Select/tailwind/index.vue'
import SliderDemo from '../../components/demo/Slider/tailwind/index.vue'
import TagsInputDemo from '../../components/demo/TagsInput/tailwind/index.vue'
import ToolbarDemo from '../../components/demo/Toolbar/tailwind/index.vue'
import TreeDemo from '../../components/demo/Tree/tailwind/index.vue'
import Chip from './Chip.vue'
</script>

<template>
  <section>
    <div class="grid justify-items-center gap-8 p-5 px-3 sm:px-4 md:gap-10 md:px-8">
      <div class="mt-2 grid w-full max-w-4xl justify-items-center gap-[inherit] sm:mt-10 md:mt-20">
        <div class="flex flex-col items-center gap-4">
          <Chip href="/docs/overview/releases">
            <div class="group-hover:scale-150 group-focus:scale-150 transition origin-bottom-left">
              🎉
            </div>
            <span class="group-hover:ml-3 group-focus:ml-3 ml-1 transition-[margin]">v2 Release!</span>
          </Chip>
          <h1 class="text-pretty text-center text-4xl font-bold sm:text-6xl sm:font-extrabold md:text-7xl text-foreground">
            Craft accessible web apps with Vue
          </h1>
        </div>

        <p class="max-w-[720px] text-pretty text-center text-lg md:text-xl md:leading-8 lg:leading-9 lg:text-2xl text-muted-foreground">
          An open-source library with
          <a
            class="relative inline-block text-foreground font-semibold before:absolute before:top-full before:inset-x-0 before:[translate:0_-0.1em] before:h-[2px] before:bg-primary hover:before:h-[4px]"
            href="/docs/guides/styling"
          >
            unstyled</a>,
          <a
            class="relative inline-block text-foreground font-semibold before:absolute before:top-full before:inset-x-0 before:[translate:0_-0.1em] before:h-[2px] before:bg-primary hover:before:h-[4px]"
            href="/docs/guides/composition"
          >
            primitive
          </a>
          components,
          accompanied by a variety of
          <a
            class="relative inline-block text-foreground font-semibold before:absolute before:top-full before:inset-x-0 before:[translate:0_-0.1em] before:h-[2px] before:bg-primary hover:before:h-[4px]"
            href="/examples"
          >
            examples & use cases
          </a>
          ready to be integrated into your projects.
        </p>
      </div>
      <div class="mb-12 flex max-w-[calc(100%-2rem)] flex-wrap items-center justify-center gap-4 md:mb-20">
        <a
          class="flex items-center justify-center gap-2 whitespace-nowrap rounded-lg py-2.5 px-5 bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
          href="/docs/overview/getting-started"
        >
          Get started
        </a>
        <a
          class="group flex items-center justify-center gap-2 font-semibold text-foreground/70 hover:text-foreground whitespace-nowrap rounded-lg py-2.5 px-5 hover:bg-card border border-muted bg-muted/50"
          href="/docs/components/checkbox"
        >
          Explore components
          <Icon icon="lucide:arrow-right" />
        </a>
      </div>
    </div>
  </section>

  <section class="hidden md:block text-foreground relative h-[40rem] mt-12 overflow-hidden w-full">
    <div class=" w-[90rem] h-[32rem] rounded-3xl border border-muted bg-card/20 absolute left-1/2 -translate-x-1/2 overflow-hidden">
      <img
        class="absolute w-[90rem] flex-none max-w-none"
        decoding="async"
        src="/new-bg.png"
        alt="backdrop"
        draggable="false"
      >
    </div>
    <div class="absolute left-1/2 z-[1] h-[32rem] w-[90rem] -translate-x-1/2 md:block">
      <div class="absolute top-8 left-[16rem] xl:left-8">
        <TagsInputDemo />
      </div>

      <div class="absolute top-[24rem] md:top-[4rem] right-[32rem] md:right-[30rem] text-stone-700 text-sm">
        <PinInputDemo />
      </div>

      <div class="absolute top-8 right-[30rem] md:right-[10rem] xl:right-6">
        <CalendarDemo />
      </div>

      <div class="absolute top-[8rem] left-[20rem]">
        <AccordionDemo />
      </div>

      <div class="absolute top-48 left-[2rem] xl:-left-12">
        <TreeDemo />
      </div>

      <div class="absolute bottom-[6rem] xl:bottom-12 left-[20rem] xl:left-[14rem]">
        <SliderDemo />
      </div>

      <div class="absolute bottom-2 xl:-bottom-4 left-[32rem] text-sm text-stone-700">
        <NumberFieldDemo />
      </div>

      <div class="absolute hidden md:block bottom-[4rem] right-[36rem] xl:right-[32rem]">
        <SelectDemo />
      </div>

      <div class="absolute hidden md:block top-[12rem] right-[40rem] xl:right-[24rem]">
        <HoverCardDemo />
      </div>

      <div class="absolute bottom-0 right-[8rem] xl:-right-12">
        <ToolbarDemo />
      </div>

      <div class="absolute hidden md:block bottom-[12rem] right-[30rem] xl:right-[22rem]">
        <ProgressDemo />
      </div>
    </div>
  </section>

  <section class="px-4 py-12 md:py-24 max-w-screen-xl mx-auto md:px-6">
    <div class="grid grid-cols-1 lg:grid-cols-5 md:h-[36rem] lg:h-96 gap-y-4 lg:gap-4">
      <div class="flex flex-col col-span-3 rounded-2xl border border-muted bg-card p-6 md:p-10 overflow-hidden relative">
        <div class="font-bold text-lg">
          Accessibility out of the box.
        </div>
        <div class="text-muted-foreground">
          Supports assistive technology
        </div>

        <img
          class="absolute -scale-y-100 -left-40 max-w-none w-[1000px] -bottom-40"
          src="/bg.png"
          alt="Background"
        >
        <div class="mt-6 md:mt-0 w-full h-full flex flex-col gap-2 items-start md:items-center justify-center relative ">
          <div class="md:absolute font-medium text-sm text-muted-foreground md:-translate-x-40 md:-translate-y-0 rounded-full border border-muted px-5 py-2.5 bg-background/50 backdrop-blur-lg flex items-center gap-2">
            <Icon
              icon="lucide:shield-check"
              class="text-primary text-xl"
            />
            <span>WAI-ARIA compliant</span>
          </div>

          <div class="md:absolute font-medium text-sm text-muted-foreground md:translate-x-28 md:-translate-y-16 rounded-full border border-muted px-5 py-2.5 bg-background/50 backdrop-blur-lg flex items-center gap-2">
            <Icon
              icon="lucide:keyboard"
              class="text-primary text-xl"
            />
            <span>Keyboard navigation</span>
          </div>

          <div class="md:absolute font-medium text-sm text-muted-foreground md:-translate-x-20 md:translate-y-16 rounded-full border border-muted px-5 py-2.5 bg-background/50 backdrop-blur-lg flex items-center gap-2">
            <Icon
              icon="lucide:text-cursor-input"
              class="text-primary text-xl"
            />
            <span>Focus management</span>
          </div>

          <div class="md:absolute font-medium text-sm text-muted-foreground md:translate-x-44 md:translate-y-4 rounded-full border border-muted px-5 py-2.5 bg-background/50 backdrop-blur-lg flex items-center gap-2">
            <Icon
              icon="lucide:view"
              class="text-primary text-xl"
            />
            <span>Screen reader support</span>
          </div>
        </div>

        <div />
      </div>
      <div class="col-span-2 rounded-2xl border border-muted bg-card h-[22rem] md:h-auto p-6 md:p-10 relative overflow-hidden">
        <div>
          <div class="font-bold text-lg">
            Save time. Ship faster.
          </div>
          <div class="text-muted-foreground">
            40+ Primitive Components
          </div>
        </div>

        <div class="flex flex-col items-center justify-center w-full absolute top-12 left-1/2 -translate-x-1/2">
          <img
            draggable="false"
            class="w-[300px]"
            src="/lightning.svg"
            alt="Lightning"
          >
          <!-- <span class="font-bold text-4xl text-center -mt-20">40+ Components</span> -->
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-5 md:h-[36rem] lg:h-96 gap-y-4 lg:gap-4 mt-4">
      <div class="col-span-2 rounded-2xl border border-muted bg-card h-96 md:h-auto p-6 md:p-10 relative overflow-hidden">
        <div class="absolute flex flex-col w-full">
          <div class="font-bold text-lg z-10 ">
            Developer Experience First.
          </div>
          <div class="text-muted-foreground">
            Unstyled, Customizable, Familiar API
          </div>

          <div class="w-full h-full relative mt-8">
            <div class="prose language-vue">
              <pre
                class="shiki github-dark vp-code"
              ><code><span class="line"><span style="color:#E1E4E8;">&lt;</span><span style="color:#85E89D;">script</span><span style="color:#B392F0;"> setup</span><span style="color:#B392F0;"> lang</span><span style="color:#E1E4E8;">=</span><span style="color:#9ECBFF;">"ts"</span><span style="color:#E1E4E8;">&gt;</span></span>
<span class="line"><span style="color:#F97583;">import</span><span style="color:#E1E4E8;"> { AccordionRoot, AccordionItem } </span><span style="color:#F97583;">from</span><span style="color:#9ECBFF;"> 'reka-ui'</span></span>
<span class="line"><span style="color:#E1E4E8;">&lt;/</span><span style="color:#85E89D;">script</span><span style="color:#E1E4E8;">&gt;</span></span>
<span class="line" />
<span class="line"><span style="color:#E1E4E8;">&lt;</span><span style="color:#85E89D;">template</span><span style="color:#E1E4E8;">&gt;</span></span>
<span class="line"><span style="color:#E1E4E8;">  &lt;</span><span style="color:#85E89D;">AccordionRoot</span> v-model</span><span style="color:#E1E4E8;">=</span><span style="color:#9ECBFF;">"controlRef"</span><span style="color:#B392F0;"><span style="color:#E1E4E8;">&gt;</span></span>
<span class="line"><span style="color:hsl(var(--muted-foreground));">    &lt;!-- css --&gt;</span></span>
<span class="line highlighted"><span style="color:#E1E4E8;">    &lt;</span><span style="color:#85E89D;">AccordionItem</span><span style="color:#B392F0;"> class</span><span style="color:#E1E4E8;">=</span><span style="color:#9ECBFF;">"AccordionItem"</span><span style="color:#B392F0;"> /&gt;</span></span>
<span class="line"><span style="color:hsl(var(--muted-foreground));">    &lt;!-- tailwind --&gt;</span></span>
<span class="line highlighted"><span style="color:#E1E4E8;">    &lt;</span><span style="color:#85E89D;">AccordionItem</span><span style="color:#B392F0;"> class</span><span style="color:#E1E4E8;">=</span><span style="color:#9ECBFF;">"bg-white px-4 py-2"</span><span style="color:#B392F0;"> /&gt;</span></span>
<span class="line"><span style="color:#E1E4E8;">  &lt;/</span><span style="color:#85E89D;">AccordionRoot</span><span style="color:#E1E4E8;">&gt;</span></span>
<span class="line"><span style="color:#E1E4E8;">&lt;/</span><span style="color:#85E89D;">template</span><span style="color:#E1E4E8;">&gt;</span></span>
            </code></pre>
            </div>
          </div>
        </div>
      </div>

      <div class="col-span-3 rounded-2xl border border-muted bg-card h-80 md:h-auto p-6 md:p-10 relative overflow-hidden">
        <div class="z-10 absolute">
          <div class="font-bold text-xl text-white">
            Ready for an international audience
          </div>
          <div class="text-muted-foreground">
            RTL support, Locale, Numbering System
          </div>
        </div>
        <img
          draggable="false"
          class="absolute bottom-0 md:top-0 md:left-48 md:scale-[1.75] dark:mix-blend-lighten hue-rotate-[220deg] saturate-[1.2]"
          src="/globe.jpg"
          alt="Globe image"
        >
      </div>
    </div>
  </section>

  <section class="py-24 sm:py-56 w-full mx-auto px-6 bg-gradient-to-b from-background via-card/80 to-background">
    <div class="max-w-screen-xl mx-auto">
      <div class="flex flex-col sm:flex-row items-center justify-center gap-12 sm:gap-20">
        <div class="flex flex-col items-center justify-center">
          <div class="text-4xl md:text-6xl font-bold">
            1.2mil+
          </div>
          <div class="mt-1">
            Monthly downloads
          </div>
        </div>

        <div class="flex flex-col items-center justify-center">
          <div class="text-4xl md:text-6xl font-bold">
            180+
          </div>
          <div class="mt-1">
            Contributors
          </div>
        </div>

        <div class="flex flex-col items-center justify-center">
          <div class="text-4xl md:text-6xl font-bold">
            5.3k+
          </div>
          <div class="mt-1">
            GitHub Stars
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="px-4 py-12 md:py-32 max-w-screen-xl mx-auto md:px-6">
    <h2 class="text-pretty text-center text-3xl font-bold sm:text-5xl sm:font-extrabold md:text-6xl text-foreground">
      Ready to get started?
    </h2>

    <div class="mt-6 md:mt-12 grid md:grid-cols-3 gap-4 md:gap-8">
      <a
        href="/docs/overview/installation"
        class="group rounded-2xl border border-muted bg-card hover:bg-muted/50 p-4 md:p-6 relative"
      >
        <div class="p-2 text-xl rounded-lg border-primary/30 text-primary bg-primary/10 w-max group-hover:scale-105 group-focus:scale-105 transition">
          <Icon icon="lucide:wrench" />
        </div>
        <div class="mt-4 flex items-center gap-2">
          <h3 class="font-semibold text-lg">
            Install and Setup
          </h3>
          <Icon icon="lucide:arrow-right" />
        </div>
        <p class="mt-2 text-muted-foreground group-hover:text-foreground group-focus:text-foreground">
          Learn how to install and setup Reka UI in your project, and build and style a component.
        </p>
      </a>

      <a
        href="/docs/components/checkbox"
        class="group rounded-2xl border border-muted bg-card hover:bg-muted/50 p-4 md:p-6 relative"
      >
        <div class="p-2 text-xl rounded-lg border-primary/30 text-primary bg-primary/10 w-max group-hover:scale-105 group-focus:scale-105 transition">
          <Icon icon="lucide:box" />
        </div>
        <div class="mt-4 flex items-center gap-2">
          <h3 class="font-semibold text-lg">
            Browse components
          </h3>
          <Icon icon="lucide:arrow-right" />
        </div>
        <p class="mt-2 text-muted-foreground group-hover:text-foreground group-focus:text-foreground">
          Check out all the components and utilities offered by Reka UI.
        </p>
      </a>

      <a
        href="/examples/checkbox-group"
        class="group rounded-2xl border border-muted bg-card hover:bg-muted/50 p-4 md:p-6 relative"
      >
        <div class="p-2 text-xl rounded-lg border-primary/30 text-primary bg-primary/10 w-max group-hover:scale-105 group-focus:scale-105 transition">
          <Icon icon="lucide:swatch-book" />
        </div>
        <div class="mt-4 flex items-center gap-2">
          <h3 class="font-semibold text-lg">
            Explore Examples
          </h3>
          <Icon icon="lucide:arrow-right" />
        </div>
        <p class="mt-2 text-muted-foreground group-hover:text-foreground group-focus:text-foreground">
          Check out some fully styled examples showing what is possible with Reka UI.
        </p>
      </a>
    </div>
  </section>

  <footer class="px-4 py-8 max-w-screen-xl mx-auto md:px-6 justify-end flex">
    <div class="text-muted-foreground text-sm">
      2025 @ unovue
    </div>
  </footer>
</template>
