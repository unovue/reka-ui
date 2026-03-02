---
title: Color Picker
tags:
  - ColorArea
  - ColorField
  - ColorSlider
  - ColorSwatch
  - Popover
---

# Color Picker

<Description>

A comprehensive color picker component that combines ColorArea, ColorSlider, ColorField, and ColorSwatch inside a Popover. This example demonstrates how to build a complete color selection interface with 2D color area, hue and alpha sliders, and input fields for precise color value entry.

</Description>

<Tags />

<ComponentPreview type="example" name="ColorPicker" />

<ExampleSection>

### Color Picker with Popover

This example shows how to combine multiple color components to create a full-featured color picker:

- **ColorSwatch** - Displays the current color in the trigger button
- **Popover** - Contains the color picker interface
- **ColorArea** - 2D area for selecting saturation and lightness
- **ColorSlider** - Sliders for hue and alpha channels
- **ColorField** - Input fields for hex and HSL values

The components are synchronized using a shared Color object, with `normalizeColor` and `colorToString` utilities from reka-ui for color conversion.

</ExampleSection>
