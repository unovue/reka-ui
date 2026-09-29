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
    'name': 'clearable',
    'description': '<p>When <code>true</code>, clicking the currently selected rating resets the value to <code>0</code>.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'defaultValue',
    'description': '<p>The rating value when initially rendered. Use when you do not need to control the state of the rating.</p>\n',
    'type': 'number',
    'required': false
  },
  {
    'name': 'dir',
    'description': '<p>The reading direction of the combobox when applicable. &lt;br&gt; If omitted, inherits globally from <code>ConfigProvider</code> or assumes LTR (left-to-right) reading mode.</p>\n',
    'type': '\'ltr\' | \'rtl\'',
    'required': false
  },
  {
    'name': 'disabled',
    'description': '<p>When <code>true</code>, prevents the user from interacting with radio items.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'hoverable',
    'description': '<p>When <code>true</code>, the rating previews the value under the pointer on hover.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'length',
    'description': '<p>The number of rating items to render.</p>\n',
    'type': 'number',
    'required': false,
    'default': '5'
  },
  {
    'name': 'loop',
    'description': '<p>When <code>true</code>, keyboard navigation will loop from last item to first, and vice versa.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'modelValue',
    'description': '<p>The controlled rating value. Can be bound with <code>v-model</code>.</p>\n',
    'type': 'number',
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
    'description': '<p>The orientation of the component.</p>\n',
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
    'description': '<p>The granularity each rating item is divided into.</p>\n',
    'type': '1 | 0.5 | 0.25 | 0.1',
    'required': false,
    'default': '1'
  }
]" />

<EmitsTable :data="[
  {
    'name': 'update:modelValue',
    'description': '<p>Event handler called when the radio group value changes</p>\n',
    'type': '[payload: number]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'modelValue',
    'description': '',
    'type': 'number | undefined'
  },
  {
    'name': 'items',
    'description': '',
    'type': 'number[]'
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `as` | The element or component this component should render as. Can be overwritten by asChild. | `AsTag \| Component` | No | `"div"` |
| `asChild` | Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details. | `boolean` | No | - |
| `clearable` | When true, clicking the currently selected rating resets the value to 0. | `boolean` | No | - |
| `defaultValue` | The rating value when initially rendered. Use when you do not need to control the state of the rating. | `number` | No | - |
| `dir` | The reading direction of the combobox when applicable. <br> If omitted, inherits globally from ConfigProvider or assumes LTR (left-to-right) reading mode. | `"ltr" \| "rtl"` | No | - |
| `disabled` | When true, prevents the user from interacting with radio items. | `boolean` | No | - |
| `hoverable` | When true, the rating previews the value under the pointer on hover. | `boolean` | No | - |
| `length` | The number of rating items to render. | `number` | No | `5` |
| `loop` | When true, keyboard navigation will loop from last item to first, and vice versa. | `boolean` | No | - |
| `modelValue` | The controlled rating value. Can be bound with v-model. | `number` | No | - |
| `name` | The name of the field. Submitted with its owning form as part of a name/value pair. | `string` | No | - |
| `orientation` | The orientation of the component. | `"vertical" \| "horizontal"` | No | `"horizontal"` |
| `required` | When true, indicates that the user must set the value before the owning form can be submitted. | `boolean` | No | - |
| `step` | The granularity each rating item is divided into. | `1 \| 0.5 \| 0.25 \| 0.1` | No | `1` |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `update:modelValue` | Event handler called when the radio group value changes | `[payload: number]` |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `modelValue` |  | `number \| undefined` |
| `items` |  | `number[]` |

</llm-only>
