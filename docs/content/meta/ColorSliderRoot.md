<!-- This file was automatically generated. Do not edit it manually -->

<llm-exclude>
<PropsTable :data="[
  {
    'name': 'as',
    'description': '<p>The element or component this component should render as. Can be overwritten by <code>asChild</code>.</p>\n',
    'type': 'AsTag | Component',
    'required': false,
    'default': '\'span\''
  },
  {
    'name': 'asChild',
    'description': '<p>Change the default rendered element for the one passed as a child, merging their props and behavior.</p>\n<p>Read our <a href=\'https://www.reka-ui.com/docs/guides/composition\'>Composition</a> guide for more details.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'channel',
    'description': '<p>The color channel that this slider manipulates.</p>\n',
    'type': '\'hue\' | \'saturation\' | \'red\' | \'green\' | \'blue\' | \'alpha\' | \'lightness\' | \'brightness\'',
    'required': true
  },
  {
    'name': 'colorSpace',
    'description': '<p>The color space to operate in.</p>\n',
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
    'name': 'dir',
    'description': '<p>The reading direction of the slider.</p>\n',
    'type': '\'ltr\' | \'rtl\'',
    'required': false
  },
  {
    'name': 'disabled',
    'description': '<p>When <code>true</code>, prevents the user from interacting with the slider.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'inverted',
    'description': '<p>Whether the slider is visually inverted.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
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
    'name': 'orientation',
    'description': '<p>The orientation of the slider.</p>\n',
    'type': '\'vertical\' | \'horizontal\'',
    'required': false,
    'default': '\'horizontal\''
  },
  {
    'name': 'required',
    'description': '<p>When <code>true</code>, indicates that the user must set the value before the owning form can be submitted.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'step',
    'description': '<p>Custom step value for increment/decrement. Defaults to the channel\'s natural step.</p>\n',
    'type': 'number',
    'required': false
  }
]" />

<EmitsTable :data="[
  {
    'name': 'change',
    'description': '',
    'type': '[value: string]'
  },
  {
    'name': 'changeEnd',
    'description': '',
    'type': '[value: string]'
  },
  {
    'name': 'update:color',
    'description': '',
    'type': '[value: Color]'
  },
  {
    'name': 'update:modelValue',
    'description': '<p>Event handler called when the value of the checkbox changes.</p>\n',
    'type': '[value: string | Color]'
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `as` | The element or component this component should render as. Can be overwritten by asChild. | `AsTag \| Component` | No | `"span"` |
| `asChild` | Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details. | `boolean` | No | - |
| `channel` | The color channel that this slider manipulates. | `"hue" \| "saturation" \| "red" \| "green" \| "blue" \| "alpha" \| "lightness" \| "brightness"` | Yes | - |
| `colorSpace` | The color space to operate in. | `"hsl" \| "rgb" \| "hsb"` | No | `"hsl"` |
| `defaultValue` | The default color value (uncontrolled). | `string \| Color` | No | `"#000000"` |
| `dir` | The reading direction of the slider. | `"ltr" \| "rtl"` | No | - |
| `disabled` | When true, prevents the user from interacting with the slider. | `boolean` | No | `false` |
| `inverted` | Whether the slider is visually inverted. | `boolean` | No | `false` |
| `modelValue` | The color value (controlled). Can be a hex string or Color object. | `string \| Color` | No | - |
| `name` | The name of the field. Submitted with its owning form as part of a name/value pair. | `string` | No | - |
| `orientation` | The orientation of the slider. | `"vertical" \| "horizontal"` | No | `"horizontal"` |
| `required` | When true, indicates that the user must set the value before the owning form can be submitted. | `boolean` | No | - |
| `step` | Custom step value for increment/decrement. Defaults to the channel's natural step. | `number` | No | - |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `change` |  | `[value: string]` |
| `changeEnd` |  | `[value: string]` |
| `update:color` |  | `[value: Color]` |
| `update:modelValue` | Event handler called when the value of the checkbox changes. | `[value: string \| Color]` |

</llm-only>
