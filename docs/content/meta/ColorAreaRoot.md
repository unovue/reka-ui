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
    'name': 'colorSpace',
    'description': '<p>The color space to operate in.</p>\n',
    'type': '\'hsl\' | \'rgb\' | \'hsb\'',
    'required': false,
    'default': '\'hsl\''
  },
  {
    'name': 'defaultValue',
    'description': '<p>The default color value (uncontrolled). A string is parsed once.</p>\n',
    'type': 'string | Color',
    'required': false,
    'default': '\'#ff0000\''
  },
  {
    'name': 'dir',
    'description': '<p>The reading direction of the area. In <code>rtl</code> the x axis runs right to left. If omitted, inherits from <code>ConfigProvider</code> or assumes <code>ltr</code>.</p>\n',
    'type': '\'ltr\' | \'rtl\'',
    'required': false
  },
  {
    'name': 'disabled',
    'description': '<p>When <code>true</code>, prevents the user from interacting with the area.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
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
    'name': 'required',
    'description': '<p>When <code>true</code>, indicates that the user must set the value before the owning form can be submitted.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'xChannel',
    'description': '<p>Color channel for the horizontal (x) axis.</p>\n',
    'type': '\'hue\' | \'saturation\' | \'red\' | \'green\' | \'blue\' | \'alpha\' | \'lightness\' | \'brightness\'',
    'required': false,
    'default': '\'hue\''
  },
  {
    'name': 'xName',
    'description': '<p>The name of the x channel input element for form submission.</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'yChannel',
    'description': '<p>Color channel for the vertical (y) axis.</p>\n',
    'type': '\'hue\' | \'saturation\' | \'red\' | \'green\' | \'blue\' | \'alpha\' | \'lightness\' | \'brightness\'',
    'required': false,
    'default': '\'saturation\''
  },
  {
    'name': 'yName',
    'description': '<p>The name of the y channel input element for form submission.</p>\n',
    'type': 'string',
    'required': false
  }
]" />

<EmitsTable :data="[
  {
    'name': 'beforeUpdate:modelValue',
    'description': '<p>Event handler called before the color value changes; <code>details.cancel()</code> vetoes the change.</p>\n',
    'type': '[value: Color, details: ChangeEventDetails&lt;ColorAreaChangeReason, Event&gt;]'
  },
  {
    'name': 'change',
    'description': '<p>Event handler called on every pointer move or keyboard step that changes the color.</p>\n',
    'type': '[value: Color]'
  },
  {
    'name': 'changeEnd',
    'description': '<p>Event handler called when an interaction that changed the color ends: on pointer release and after each keyboard step.</p>\n',
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
    'type': '[value: Color, details: ChangeEventDetails&lt;ColorAreaChangeReason, Event&gt;]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'style',
    'description': '<p>CSS styles for the color area background gradient</p>\n',
    'type': 'CSSProperties'
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `as` | The element or component this component should render as. Can be overwritten by `asChild`. | `AsTag \| Component` | No | `"div"` |
| `asChild` | Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details. | `boolean` | No | - |
| `colorSpace` | The color space to operate in. | `"hsl" \| "rgb" \| "hsb"` | No | `"hsl"` |
| `defaultValue` | The default color value (uncontrolled). A string is parsed once. | `string \| Color` | No | `"#ff0000"` |
| `dir` | The reading direction of the area. In `rtl` the x axis runs right to left. If omitted, inherits from `ConfigProvider` or assumes `ltr`. | `"ltr" \| "rtl"` | No | - |
| `disabled` | When `true`, prevents the user from interacting with the area. | `boolean` | No | `false` |
| `modelValue` | The color value (controlled). A string is parsed once; emitted values are always `Color` objects. | `string \| Color` | No | - |
| `name` | The name of the field. Submitted with its owning form as part of a name/value pair. | `string` | No | - |
| `required` | When `true`, indicates that the user must set the value before the owning form can be submitted. | `boolean` | No | - |
| `xChannel` | Color channel for the horizontal (x) axis. | `"hue" \| "saturation" \| "red" \| "green" \| "blue" \| "alpha" \| "lightness" \| "brightness"` | No | `"hue"` |
| `xName` | The name of the x channel input element for form submission. | `string` | No | - |
| `yChannel` | Color channel for the vertical (y) axis. | `"hue" \| "saturation" \| "red" \| "green" \| "blue" \| "alpha" \| "lightness" \| "brightness"` | No | `"saturation"` |
| `yName` | The name of the y channel input element for form submission. | `string` | No | - |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `beforeUpdate:modelValue` | Event handler called before the color value changes; `details.cancel()` vetoes the change. | `[value: Color, details: ChangeEventDetails<ColorAreaChangeReason, Event>]` |
| `change` | Event handler called on every pointer move or keyboard step that changes the color. | `[value: Color]` |
| `changeEnd` | Event handler called when an interaction that changed the color ends: on pointer release and after each keyboard step. | `[value: Color]` |
| `update:color` | Event handler called with the same `Color` as `update:modelValue`, after it. | `[value: Color]` |
| `update:hex` | Event handler called with the hex serialization of the new color, after `update:modelValue`. Lossy: drops the hue of greys and sub-byte precision. | `[value: string]` |
| `update:modelValue` | Event handler called when the color value changes. | `[value: Color, details: ChangeEventDetails<ColorAreaChangeReason, Event>]` |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `style` | CSS styles for the color area background gradient | `CSSProperties` |

</llm-only>
