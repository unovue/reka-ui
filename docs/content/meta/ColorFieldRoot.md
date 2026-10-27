<!-- This file was automatically generated. Do not edit it manually -->

<llm-exclude>
<PropsTable :data="[
  {
    'name': 'as',
    'description': '<p>The element or component this component should render as. Can be overwritten by <code>asChild</code>.</p>\n',
    'type': 'AsTag | Component',
    'required': false,
    'default': '\'div\''
  },
  {
    'name': 'asChild',
    'description': '<p>Change the default rendered element for the one passed as a child, merging their props and behavior.</p>\n<p>Read our <a href=\'https://www.reka-ui.com/docs/guides/composition\'>Composition</a> guide for more details.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'channel',
    'description': '<p>The color channel to display. If not provided, displays hex value.</p>\n',
    'type': '\'hue\' | \'saturation\' | \'red\' | \'green\' | \'blue\' | \'alpha\' | \'lightness\' | \'brightness\'',
    'required': false
  },
  {
    'name': 'colorSpace',
    'description': '<p>The color space to operate in when displaying a channel.</p>\n',
    'type': '\'hsl\' | \'rgb\' | \'hsb\'',
    'required': false,
    'default': '\'hsl\''
  },
  {
    'name': 'defaultValue',
    'description': '<p>The default color value (uncontrolled). A string is parsed once.</p>\n',
    'type': 'string | Color',
    'required': false,
    'default': '\'#000000\''
  },
  {
    'name': 'disabled',
    'description': '<p>When <code>true</code>, prevents the user from interacting with the field.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'disableWheelChange',
    'description': '<p>When <code>true</code>, prevents the value from changing on wheel scroll.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'locale',
    'description': '<p>The locale to use for number formatting.</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'modelValue',
    'description': '<p>The color value (controlled). A string is parsed once; emitted values are always <code>Color</code> objects.</p>\n',
    'type': 'string | Color',
    'required': false
  },
  {
    'name': 'name',
    'description': '<p>The name of the field. Submitted with its owning form as part of a name/value pair.</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'placeholder',
    'description': '<p>Placeholder text when the field is empty.</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'readonly',
    'description': '<p>When <code>true</code>, the field is read-only.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'required',
    'description': '<p>When <code>true</code>, indicates that the user must set the value before the owning form can be submitted.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'step',
    'description': '<p>Custom step value for increment/decrement. Defaults to channel step or 1 for hex.</p>\n',
    'type': 'number',
    'required': false
  }
]" />

<EmitsTable :data="[
  {
    'name': 'beforeUpdate:modelValue',
    'description': '<p>Event handler called before the color value changes; <code>details.cancel()</code> vetoes the change.</p>\n',
    'type': '[value: Color, details: ChangeEventDetails&lt;ColorFieldChangeReason, Event&gt;]'
  },
  {
    'name': 'change',
    'description': '<p>Event handler called when a committed edit, step or wheel change changes the color. Typing does not change the color until it is committed.</p>\n',
    'type': '[value: Color]'
  },
  {
    'name': 'changeEnd',
    'description': '<p>Event handler called after each committed change, together with <code>change</code>: every field change is a complete interaction.</p>\n',
    'type': '[value: Color]'
  },
  {
    'name': 'update:color',
    'description': '<p>Event handler called with the same <code>Color</code> as <code>update:modelValue</code>, after it.</p>\n',
    'type': '[value: Color]'
  },
  {
    'name': 'update:hex',
    'description': '<p>Event handler called with the hex serialization of the new color, after <code>update:modelValue</code>. Lossy: drops the hue of greys and sub-byte precision.</p>\n',
    'type': '[value: string]'
  },
  {
    'name': 'update:modelValue',
    'description': '<p>Event handler called when the color value changes.</p>\n',
    'type': '[value: Color, details: ChangeEventDetails&lt;ColorFieldChangeReason, Event&gt;]'
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `as` | The element or component this component should render as. Can be overwritten by asChild. | `AsTag \| Component` | No | `"div"` |
| `asChild` | Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details. | `boolean` | No | - |
| `channel` | The color channel to display. If not provided, displays hex value. | `"hue" \| "saturation" \| "red" \| "green" \| "blue" \| "alpha" \| "lightness" \| "brightness"` | No | - |
| `colorSpace` | The color space to operate in when displaying a channel. | `"hsl" \| "rgb" \| "hsb"` | No | `"hsl"` |
| `defaultValue` | The default color value (uncontrolled). A string is parsed once. | `string \| Color` | No | `"#000000"` |
| `disabled` | When true, prevents the user from interacting with the field. | `boolean` | No | `false` |
| `disableWheelChange` | When true, prevents the value from changing on wheel scroll. | `boolean` | No | `false` |
| `locale` | The locale to use for number formatting. | `string` | No | - |
| `modelValue` | The color value (controlled). A string is parsed once; emitted values are always Color objects. | `string \| Color` | No | - |
| `name` | The name of the field. Submitted with its owning form as part of a name/value pair. | `string` | No | - |
| `placeholder` | Placeholder text when the field is empty. | `string` | No | - |
| `readonly` | When true, the field is read-only. | `boolean` | No | `false` |
| `required` | When true, indicates that the user must set the value before the owning form can be submitted. | `boolean` | No | - |
| `step` | Custom step value for increment/decrement. Defaults to channel step or 1 for hex. | `number` | No | - |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `beforeUpdate:modelValue` | Event handler called before the color value changes; details.cancel() vetoes the change. | `[value: Color, details: ChangeEventDetails<ColorFieldChangeReason, Event>]` |
| `change` | Event handler called when a committed edit, step or wheel change changes the color. Typing does not change the color until it is committed. | `[value: Color]` |
| `changeEnd` | Event handler called after each committed change, together with change: every field change is a complete interaction. | `[value: Color]` |
| `update:color` | Event handler called with the same Color as update:modelValue, after it. | `[value: Color]` |
| `update:hex` | Event handler called with the hex serialization of the new color, after update:modelValue. Lossy: drops the hue of greys and sub-byte precision. | `[value: string]` |
| `update:modelValue` | Event handler called when the color value changes. | `[value: Color, details: ChangeEventDetails<ColorFieldChangeReason, Event>]` |

</llm-only>
