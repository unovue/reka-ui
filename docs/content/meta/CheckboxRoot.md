<!-- This file was automatically generated. Do not edit it manually -->

<llm-exclude>
<PropsTable :data="[
  {
    'name': 'as',
    'description': '<p>The element or component this component should render as. Can be overwritten by <code>asChild</code>.</p>\n',
    'type': 'AsTag | Component',
    'required': false,
    'default': '\'button\''
  },
  {
    'name': 'asChild',
    'description': '<p>Change the default rendered element for the one passed as a child, merging their props and behavior.</p>\n<p>Read our <a href=\'https://www.reka-ui.com/docs/guides/composition\'>Composition</a> guide for more details.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'defaultValue',
    'description': '<p>The value of the checkbox when it is initially rendered. Use when you do not need to control its value.</p>\n',
    'type': 'unknown',
    'required': false
  },
  {
    'name': 'disabled',
    'description': '<p>When <code>true</code>, prevents the user from interacting with the checkbox</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'falseValue',
    'description': '<p>The value used when the checkbox is unchecked. Defaults to <code>false</code>.</p>\n',
    'type': 'unknown',
    'required': false,
    'default': '(() => false) as unknown as undefined'
  },
  {
    'name': 'id',
    'description': '<p>Id of the element</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'modelValue',
    'description': '<p>The controlled value of the checkbox. Can be binded with v-model.</p>\n',
    'type': 'unknown',
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
    'name': 'trueValue',
    'description': '<p>The value used when the checkbox is checked. Defaults to <code>true</code>.</p>\n',
    'type': 'unknown',
    'required': false,
    'default': '(() => true) as unknown as undefined'
  },
  {
    'name': 'value',
    'description': '<p>The value given as data when submitted with a <code>name</code>.</p>\n',
    'type': 'AcceptableValue',
    'required': false,
    'default': '\'on\''
  }
]" />

<EmitsTable :data="[
  {
    'name': 'update:modelValue',
    'description': '<p>Event handler called when the value of the checkbox changes.</p>\n',
    'type': '[value: unknown]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'modelValue',
    'description': '<p>Current value</p>\n',
    'type': 'unknown'
  },
  {
    'name': 'state',
    'description': '<p>Current state</p>\n',
    'type': 'false | true | \'indeterminate\''
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `as` | The element or component this component should render as. Can be overwritten by asChild. | `AsTag \| Component` | No | `"button"` |
| `asChild` | Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details. | `boolean` | No | - |
| `defaultValue` | The value of the checkbox when it is initially rendered. Use when you do not need to control its value. | `unknown` | No | - |
| `disabled` | When true, prevents the user from interacting with the checkbox | `boolean` | No | - |
| `falseValue` | The value used when the checkbox is unchecked. Defaults to false. | `unknown` | No | `(() => false) as unknown as undefined` |
| `id` | Id of the element | `string` | No | - |
| `modelValue` | The controlled value of the checkbox. Can be binded with v-model. | `unknown` | No | - |
| `name` | The name of the field. Submitted with its owning form as part of a name/value pair. | `string` | No | - |
| `required` | When true, indicates that the user must set the value before the owning form can be submitted. | `boolean` | No | - |
| `trueValue` | The value used when the checkbox is checked. Defaults to true. | `unknown` | No | `(() => true) as unknown as undefined` |
| `value` | The value given as data when submitted with a name. | `AcceptableValue` | No | `"on"` |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `update:modelValue` | Event handler called when the value of the checkbox changes. | `[value: unknown]` |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `modelValue` | Current value | `unknown` |
| `state` | Current state | `false \| true \| "indeterminate"` |

</llm-only>
