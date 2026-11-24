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
    'name': 'defaultValue',
    'description': '<p>The value of the slider area when initially rendered. Use when you do not need to control the state.</p>\n',
    'type': 'number[][]',
    'required': false,
    'default': '[[0, 0]] as number[][]'
  },
  {
    'name': 'dir',
    'description': '<p>The reading direction. If omitted, inherits globally from <code>ConfigProvider</code> or assumes LTR.</p>\n',
    'type': '\'ltr\' | \'rtl\'',
    'required': false
  },
  {
    'name': 'disabled',
    'description': '<p>When <code>true</code>, prevents the user from interacting with the slider area.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'invertedX',
    'description': '<p>Whether the X axis is visually inverted.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'invertedY',
    'description': '<p>Whether the Y axis is visually inverted.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'maxX',
    'description': '<p>The maximum value for the X axis.</p>\n',
    'type': 'number',
    'required': false,
    'default': '100'
  },
  {
    'name': 'maxY',
    'description': '<p>The maximum value for the Y axis.</p>\n',
    'type': 'number',
    'required': false,
    'default': '100'
  },
  {
    'name': 'minX',
    'description': '<p>The minimum value for the X axis.</p>\n',
    'type': 'number',
    'required': false,
    'default': '0'
  },
  {
    'name': 'minXStepsBetweenThumbs',
    'description': '<p>The minimum permitted steps between multiple thumbs on the X axis.</p>\n',
    'type': 'number',
    'required': false,
    'default': '0'
  },
  {
    'name': 'minY',
    'description': '<p>The minimum value for the Y axis.</p>\n',
    'type': 'number',
    'required': false,
    'default': '0'
  },
  {
    'name': 'minYStepsBetweenThumbs',
    'description': '<p>The minimum permitted steps between multiple thumbs on the Y axis.</p>\n',
    'type': 'number',
    'required': false,
    'default': '0'
  },
  {
    'name': 'modelValue',
    'description': '<p>The controlled value of the slider area. Can be bind as <code>v-model</code>.</p>\n',
    'type': 'number[][] | null',
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
    'name': 'stepX',
    'description': '<p>The stepping interval for the X axis.</p>\n',
    'type': 'number',
    'required': false,
    'default': '1'
  },
  {
    'name': 'stepY',
    'description': '<p>The stepping interval for the Y axis.</p>\n',
    'type': 'number',
    'required': false,
    'default': '1'
  },
  {
    'name': 'thumbAlignment',
    'description': '<p>The alignment of the slider area thumb.</p>\n<ul>\n<li><code>contain</code>: thumbs will be contained within the bounds of the track.</li>\n<li><code>overflow</code>: thumbs will not be bound by the track. No extra offset will be added.</li>\n</ul>\n',
    'type': '\'overflow\' | \'contain\'',
    'required': false,
    'default': '\'overflow\''
  }
]" />

<EmitsTable :data="[
  {
    'name': 'update:modelValue',
    'description': '<p>Event handler called when the slider area value changes</p>\n',
    'type': '[payload: number[][]]'
  },
  {
    'name': 'valueCommit',
    'description': '<p>Event handler called when the value changes at the end of an interaction.</p>\n',
    'type': '[payload: number[][]]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'modelValue',
    'description': '<p>Current slider area values</p>\n',
    'type': 'number[][] | null'
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `as` | The element or component this component should render as. Can be overwritten by asChild. | `AsTag \| Component` | No | `"div"` |
| `asChild` | Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details. | `boolean` | No | - |
| `defaultValue` | The value of the slider area when initially rendered. Use when you do not need to control the state. | `number[][]` | No | `[[0, 0]] as number[][]` |
| `dir` | The reading direction. If omitted, inherits globally from ConfigProvider or assumes LTR. | `"ltr" \| "rtl"` | No | - |
| `disabled` | When true, prevents the user from interacting with the slider area. | `boolean` | No | `false` |
| `invertedX` | Whether the X axis is visually inverted. | `boolean` | No | `false` |
| `invertedY` | Whether the Y axis is visually inverted. | `boolean` | No | `false` |
| `maxX` | The maximum value for the X axis. | `number` | No | `100` |
| `maxY` | The maximum value for the Y axis. | `number` | No | `100` |
| `minX` | The minimum value for the X axis. | `number` | No | `0` |
| `minXStepsBetweenThumbs` | The minimum permitted steps between multiple thumbs on the X axis. | `number` | No | `0` |
| `minY` | The minimum value for the Y axis. | `number` | No | `0` |
| `minYStepsBetweenThumbs` | The minimum permitted steps between multiple thumbs on the Y axis. | `number` | No | `0` |
| `modelValue` | The controlled value of the slider area. Can be bind as v-model. | `number[][] \| null` | No | - |
| `name` | The name of the field. Submitted with its owning form as part of a name/value pair. | `string` | No | - |
| `required` | When true, indicates that the user must set the value before the owning form can be submitted. | `boolean` | No | - |
| `stepX` | The stepping interval for the X axis. | `number` | No | `1` |
| `stepY` | The stepping interval for the Y axis. | `number` | No | `1` |
| `thumbAlignment` | The alignment of the slider area thumb.  contain: thumbs will be contained within the bounds of the track. overflow: thumbs will not be bound by the track. No extra offset will be added. | `"overflow" \| "contain"` | No | `"overflow"` |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `update:modelValue` | Event handler called when the slider area value changes | `[payload: number[][]]` |
| `valueCommit` | Event handler called when the value changes at the end of an interaction. | `[payload: number[][]]` |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `modelValue` | Current slider area values | `number[][] \| null` |

</llm-only>
