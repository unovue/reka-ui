<script setup lang="ts">
import Dialog from './shadowDom/_Dialog.vue'

function handleAlert() {
  // eslint-disable-next-line no-alert
  alert('Alert')
}
</script>

<template>
  <Story
    group="utilities"
    title="DismissableLayer/DialogBodyWithNestedShadowRoot"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="default">
      <div class="h-[300vh]">
        <strong>This example is to check the behaviour of multiple nested dismissible layers when used inside a shadow root</strong>
        <br>
        <strong>The dialog is rendered in the body of the document. Inside the dialog's content, we have a shadow root rendering multiple components that can open dismissable layers in shadow root</strong>

        <ul class="list-disc ml-4">
          <li>✅ focus should move inside `Dialog` when mounted</li>
          <li>✅ focus should be trapped inside `Dialog`</li>
          <li>✅ scrolling outside `Dialog` should be disabled</li>
          <li>✅ should be able to dismiss `Dialog` on pressing escape</li>
          <li class="ml-6">
            ✅ focus should return to the open button
          </li>
          <li>
            ✅ interacting outside `Dialog` should be disabled (clicking the
            "alert me" button shouldn't do anything)
          </li>
          <li>➕</li>
          <li>
            ✅ should be able to dismiss `Dialog` when interacting outside
          </li>
          <li class="ml-6">
            ✅ focus should return to the open button
          </li>
        </ul>
        <hr class="my-2">
        <strong>It should also pass these tests:</strong>
        <ul class="list-disc ml-4">
          <li>
            <b>Combobox</b>
            <ul>
              <li>✅ interacting inside a nested combobox popper's content should not close the dialog</li>
              <li>
                ✅ interacting outside a nested combobox popper's content, but inside the dialog's content should close the combobox's content,
                but not close the dialog
              </li>
              <li>
                ✅ interacting outside a nested combobox popper's content and outside the dialog's content should close the combobox's content and the dialog, as the combobox content is not in modal mode
              </li>
              <li>
                ✅ pressing the escape key should close the combobox's content, but not close the dialog
              </li>
            </ul>
          </li>
          <li>
            <b>Popover</b>
            <ul>
              <li>✅ interacting inside a nested popover's content should not close the dialog</li>
              <li>
                ✅ interacting outside a nested popover's content (in modal mode) should close the popover's content,
                but not close the dialog
              </li>
              <li>
                ✅ interacting outside a nested popover's content (in non-modal mode) should close the popover's content and the dialog
              </li>
            </ul>
          </li>
          <li>
            <b>Dropdown Menu</b>
            <ul>
              <li>✅ interacting inside a dropdown menu or its sub menus should not close the dialog</li>
              <li>
                ✅ interacting outside a dropdown menu or its sub menus (in modal mode) should close the dropdown menu, but not close the dialog
              </li>
              <li>
                ✅ interacting outside a dropdown menu or its sub menus (in non-modal mode) should close the dropdown menu and close the dialog
              </li>
            </ul>
          </li>
        </ul>

        <div class="flex flex-col gap-4 mt-12">
          <Dialog has-shadow-root-inside />
          <button @click="handleAlert">
            Alert me
          </button>
        </div>
      </div>
    </Variant>
  </Story>
</template>
