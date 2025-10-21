---

title: Getting started
description: A quick tutorial to get you up and running with Reka UI.
name: getting-started
---

# Getting started

<Description>
A quick tutorial to get you up and running with Reka UI.
</Description>

## Implementing a Popover

In this quick tutorial, we will install and style the [Popover](../components/popover) component.

### 1. Install the library

Install the component from your command line.

<InstallationTabs value="reka-ui" />

### 2. Import the parts

Import and structure the parts.

```vue twoslash
<!-- Popover.vue -->
<script setup lang="ts">
import { PopoverArrow, PopoverClose, PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'reka-ui'
</script>

<template>
  <PopoverRoot>
    <PopoverTrigger>More info</PopoverTrigger>
    <PopoverPortal>
      <PopoverContent>
        Some more info...
        <PopoverClose />
        <PopoverArrow />
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
```

### 3. Add your styles

Add styles where desired.

```vue
<template>
  <PopoverRoot>
    <PopoverTrigger class="PopoverTrigger">
      More info
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent class="PopoverContent">
        Some more info...
        <PopoverClose />
        <PopoverArrow class="PopoverArrow" />
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>

<style>
.PopoverTrigger {
  background-color: white;
  border-radius: 4px;
}

.PopoverContent {
  border-radius: 4px;
  padding: 20px;
  width: 260px;
  background-color: white;
}

.PopoverArrow {
  background-color: white;
}
</style>
```

### Demo

Here's a complete demo.

<ComponentPreview name="Popover" />

## Summary

The steps above outline briefly what's involved in using a Reka UI in your application.

These components are low-level enough to give you control over how you want to wrap them. You're free to introduce your own high-level API to better suit the needs of your team and product.

In a few simple steps, we've implemented a fully accessible Popover component, without having to worry about many of its complexities.

- Adheres to [WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) design pattern.
- Can be controlled or uncontrolled.
- Customize side, alignment, offsets, collision handling.
- Optionally render a pointing arrow.
- Focus is fully managed and customizable.
- Dismissing and layering behavior is highly customizable.

## Working with LLMs

Reka UI documentation is optimized for Large Language Models (LLMs) to help you get AI-powered assistance while working with our components.

### LLM-Friendly Documentation

Our documentation includes a special LLM-friendly format that makes it easier for AI assistants to understand and provide accurate help with Reka UI components. This format:

- Removes visual elements and complex formatting that can confuse LLMs
- Structures content in a way that's optimized for text processing
- Includes comprehensive component information in a linear format
- Maintains all the essential technical details while being machine-readable

### Accessing LLM Documentation

You can access the LLM-optimized version of our documentation at [llms.txt](/llms.txt). This file contains:

- Complete overview of all Reka UI components
- Detailed API documentation
- Usage examples and implementation patterns
- Accessibility guidelines
- Styling and customization options

### Using LLMs with Reka UI

When working with LLMs like ChatGPT, Claude, or other AI assistants, you can:

1. **Reference the llms.txt file**: Direct your AI assistant to the `/llms.txt` file for comprehensive context about Reka UI
2. **Ask specific questions**: Get help with implementation, styling, or accessibility features
3. **Generate code examples**: Request custom implementations based on your specific needs
4. **Troubleshoot issues**: Get assistance with common problems or edge cases

### Example Prompts

Here are some example prompts you can use with LLMs:

```
"Using the Reka UI documentation at https://reka-ui.com/llms.txt, help me implement a custom Dialog component with form validation."

"Based on the Reka UI llms.txt documentation, show me how to create an accessible Select component with custom styling."

"Refer to the Reka UI llms.txt file and explain how to properly implement keyboard navigation for a Combobox component."
```

By leveraging our LLM-optimized documentation, you can get more accurate and helpful responses from AI assistants when working with Reka UI components.
