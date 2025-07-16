<script setup lang="ts">
import { TabsContent, TabsIndicator, TabsList, TabsRoot, TabsTrigger } from 'reka-ui'
import './styles.css'
</script>

<template>
  <TabsRoot
    class="TabsRoot"
    default-value="tab1"
  >
    <TabsList
      class="TabsList"
      aria-label="Manage your account"
    >
      <TabsIndicator class="TabsIndicator">
        <div
          style="width: 100%; height: 100%"
          class="bg-grass8 w-full h-full"
        />
      </TabsIndicator>
      <TabsTrigger
        class="TabsTrigger"
        value="tab1"
      >
        Account
      </TabsTrigger>
      <TabsTrigger
        class="TabsTrigger"
        value="tab2"
      >
        Password
      </TabsTrigger>
    </TabsList>
    <TabsContent
      class="TabsContent"
      value="tab1"
    >
      <p class="Text">
        Make changes to your account here. Click save when you're done.
      </p>
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
      <fieldset class="Fieldset">
        <label
          class="Label"
          for="username"
        > Username </label>
        <input
          id="username"
          class="Input"
          value="@peduarte"
        >
      </fieldset>
      <div :style="{ display: 'flex', marginTop: 20, justifyContent: 'flex-end' }">
        <button
          class="Button green"
        >
          Save changes
        </button>
      </div>
    </TabsContent>
    <TabsContent
      class="TabsContent"
      value="tab2"
    >
      <p class="Text">
        Change your password here. After saving, you'll be logged out.
      </p>
      <fieldset class="Fieldset">
        <label
          class="Label"
          for="currentPassword"
        >
          Current password
        </label>
        <input
          id="currentPassword"
          class="Input"
          type="password"
        >
      </fieldset>
      <fieldset class="Fieldset">
        <label
          class="Label"
          for="newPassword"
        > New password </label>
        <input
          id="newPassword"
          class="Input"
          type="password"
        >
      </fieldset>
      <fieldset class="Fieldset">
        <label
          class="Label"
          for="confirmPassword"
        >
          Confirm password
        </label>
        <input
          id="confirmPassword"
          class="Input"
          type="password"
        >
      </fieldset>
      <div :style="{ display: 'flex', marginTop: 20, justifyContent: 'flex-end' }">
        <button
          class="Button green"
        >
          Change password
        </button>
      </div>
    </TabsContent>
  </TabsRoot>
</template>
