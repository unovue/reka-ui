<script setup lang="ts">
interface ProseCodeInlineProps {
  variant?: 'primary' | 'secondary'
}

const props = withDefaults(defineProps<ProseCodeInlineProps>(), {
  variant: 'primary',
})
</script>

<template>
  <code
    class="px-2"
    :class="`${
      props.variant === 'primary'
        ? 'text-primary bg-primary/10 border-none text-[13px] md:text-[14px]'
        : 'text-foreground'
    }`"
  >
    <slot />
  </code>
</template>
