<script setup vapor lang="ts">
import { Primitive } from '#reka'
</script>

<template>
  <Primitive
    id="unsafe-underscore"
    as="my_el"
  />
  <Primitive
    id="unsafe-dot"
    as="a.b"
  />
  <Primitive
    id="unsafe-script"
    as="script"
  />
  <Primitive
    id="custom-element"
    as="my-el.x_y"
  />
</template>
