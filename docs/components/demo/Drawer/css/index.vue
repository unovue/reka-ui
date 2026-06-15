<script setup lang="ts">
import {
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHandle,
  DrawerOverlay,
  DrawerPortal,
  DrawerRoot,
  DrawerTitle,
  DrawerTrigger,
} from 'reka-ui'
import './styles.css'
</script>

<template>
  <DrawerRoot>
    <DrawerTrigger class="Button grass">
      Open Drawer
    </DrawerTrigger>
    <DrawerPortal>
      <DrawerOverlay class="DrawerOverlay" />
      <DrawerContent class="DrawerContent">
        <DrawerHandle class="DrawerHandle" />
        <div class="DrawerBody">
          <DrawerTitle class="DrawerTitle">
            Edit profile
          </DrawerTitle>
          <DrawerDescription class="DrawerDescription">
            Make changes to your profile here. Swipe down or click close when you're done.
          </DrawerDescription>
          <fieldset class="Fieldset">
            <label
              class="Label"
              for="name"
            > Name </label>
            <input
              id="name"
              class="Input"
              value="Pedro Duarte"
            >
          </fieldset>
          <div class="DrawerFooter">
            <DrawerClose as-child>
              <button class="Button green">
                Save changes
              </button>
            </DrawerClose>
          </div>
        </div>
      </DrawerContent>
    </DrawerPortal>
  </DrawerRoot>
</template>
