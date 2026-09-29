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
    'description': '<p>The default color value (uncontrolled).</p>\n',
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
    'description': '<p>The color value (controlled). Can be a hex string or Color object.</p>\n',
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
    'name': 'update:color',
    'description': '',
    'type': '[value: Color]'
  },
  {
    'name': 'update:modelValue',
    'description': '<p>Event handler called when the value of the checkbox changes.</p>\n',
    'type': '[value: string]'
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
| `defaultValue` | The default color value (uncontrolled). | `string \| Color` | No | `"#000000"` |
| `disabled` | When true, prevents the user from interacting with the field. | `boolean` | No | `false` |
| `disableWheelChange` | When true, prevents the value from changing on wheel scroll. | `boolean` | No | `false` |
| `locale` | The locale to use for number formatting. | `string` | No | - |
| `modelValue` | The color value (controlled). Can be a hex string or Color object. | `string \| Color` | No | - |
| `name` | The name of the field. Submitted with its owning form as part of a name/value pair. | `string` | No | - |
| `placeholder` | Placeholder text when the field is empty. | `string` | No | - |
| `readonly` | When true, the field is read-only. | `boolean` | No | `false` |
| `required` | When true, indicates that the user must set the value before the owning form can be submitted. | `boolean` | No | - |
| `step` | Custom step value for increment/decrement. Defaults to channel step or 1 for hex. | `number` | No | - |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `update:color` |  | `[value: Color]` |
| `update:modelValue` | Event handler called when the value of the checkbox changes. | `[value: string]` |

</llm-only>
