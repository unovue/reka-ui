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
    'name': 'defaultValue',
    'description': '<p>The value of the slider when initially rendered. Use when you do not need to control the state of the slider.</p>\n',
    'type': 'number[]',
    'required': false,
    'default': '[0]'
  },
  {
    'name': 'dir',
    'description': '<p>The reading direction of the combobox when applicable. &lt;br&gt; If omitted, inherits globally from <code>ConfigProvider</code> or assumes LTR (left-to-right) reading mode.</p>\n',
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
    'name': 'max',
    'description': '<p>The maximum value for the range.</p>\n',
    'type': 'number',
    'required': false,
    'default': '100'
  },
  {
    'name': 'min',
    'description': '<p>The minimum value for the range.</p>\n',
    'type': 'number',
    'required': false,
    'default': '0'
  },
  {
    'name': 'minStepsBetweenThumbs',
    'description': '<p>The minimum permitted steps between multiple thumbs.</p>\n',
    'type': 'number',
    'required': false,
    'default': '0'
  },
  {
    'name': 'modelValue',
    'description': '<p>The controlled value of the slider. Can be bind as <code>v-model</code>.</p>\n',
    'type': 'number[] | null',
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
    'description': '<p>The stepping interval.</p>\n',
    'type': 'number',
    'required': false,
    'default': '1'
  },
  {
    'name': 'thumbAlignment',
    'description': '<p>The alignment of the slider thumb.</p>\n<ul>\n<li><code>contain</code>: thumbs will be contained within the bounds of the track.</li>\n<li><code>overflow</code>: thumbs will not be bound by the track. No extra offset will be added.</li>\n</ul>\n',
    'type': '\'contain\' | \'overflow\'',
    'required': false,
    'default': '\'contain\''
  }
]" />

<EmitsTable :data="[
  {
    'name': 'update:modelValue',
    'description': '<p>Event handler called when the slider value changes</p>\n',
    'type': '[payload: number[]]'
  },
  {
    'name': 'valueCommit',
    'description': '<p>Event handler called when the value changes at the end of an interaction.</p>\n<p>Useful when you only need to capture a final value e.g. to update a backend service.</p>\n',
    'type': '[payload: number[]]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'modelValue',
    'description': '<p>Current slider values</p>\n',
    'type': 'number[] | null'
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `as` | The element or component this component should render as. Can be overwritten by asChild. | `AsTag \| Component` | No | `"span"` |
| `asChild` | Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details. | `boolean` | No | - |
| `defaultValue` | The value of the slider when initially rendered. Use when you do not need to control the state of the slider. | `number[]` | No | `[0]` |
| `dir` | The reading direction of the combobox when applicable. <br> If omitted, inherits globally from ConfigProvider or assumes LTR (left-to-right) reading mode. | `"ltr" \| "rtl"` | No | - |
| `disabled` | When true, prevents the user from interacting with the slider. | `boolean` | No | `false` |
| `inverted` | Whether the slider is visually inverted. | `boolean` | No | `false` |
| `max` | The maximum value for the range. | `number` | No | `100` |
| `min` | The minimum value for the range. | `number` | No | `0` |
| `minStepsBetweenThumbs` | The minimum permitted steps between multiple thumbs. | `number` | No | `0` |
| `modelValue` | The controlled value of the slider. Can be bind as v-model. | `number[] \| null` | No | - |
| `name` | The name of the field. Submitted with its owning form as part of a name/value pair. | `string` | No | - |
| `orientation` | The orientation of the slider. | `"vertical" \| "horizontal"` | No | `"horizontal"` |
| `required` | When true, indicates that the user must set the value before the owning form can be submitted. | `boolean` | No | - |
| `step` | The stepping interval. | `number` | No | `1` |
| `thumbAlignment` | The alignment of the slider thumb.  contain: thumbs will be contained within the bounds of the track. overflow: thumbs will not be bound by the track. No extra offset will be added. | `"contain" \| "overflow"` | No | `"contain"` |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `update:modelValue` | Event handler called when the slider value changes | `[payload: number[]]` |
| `valueCommit` | Event handler called when the value changes at the end of an interaction. Useful when you only need to capture a final value e.g. to update a backend service. | `[payload: number[]]` |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `modelValue` | Current slider values | `number[] \| null` |

</llm-only>
