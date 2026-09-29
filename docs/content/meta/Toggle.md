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
    'description': '<p>The pressed state of the toggle when it is initially rendered. Use when you do not need to control its open state.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'disabled',
    'description': '<p>When <code>true</code>, prevents the user from interacting with the toggle.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'modelValue',
    'description': '<p>The controlled pressed state of the toggle. Can be bind as <code>v-model</code>.</p>\n',
    'type': 'boolean | null',
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
  }
]" />

<EmitsTable :data="[
  {
    'name': 'update:modelValue',
    'description': '<p>Event handler called when the value of the toggle changes.</p>\n',
    'type': '[value: boolean]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'modelValue',
    'description': '<p>Current value</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'state',
    'description': '<p>Current state</p>\n',
    'type': '\'on\' | \'off\''
  },
  {
    'name': 'pressed',
    'description': '<p>Current pressed state</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'disabled',
    'description': '<p>Current disabled state</p>\n',
    'type': 'boolean'
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `as` | The element or component this component should render as. Can be overwritten by asChild. | `AsTag \| Component` | No | `"button"` |
| `asChild` | Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details. | `boolean` | No | - |
| `defaultValue` | The pressed state of the toggle when it is initially rendered. Use when you do not need to control its open state. | `boolean` | No | - |
| `disabled` | When true, prevents the user from interacting with the toggle. | `boolean` | No | `false` |
| `modelValue` | The controlled pressed state of the toggle. Can be bind as v-model. | `boolean \| null` | No | - |
| `name` | The name of the field. Submitted with its owning form as part of a name/value pair. | `string` | No | - |
| `required` | When true, indicates that the user must set the value before the owning form can be submitted. | `boolean` | No | - |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `update:modelValue` | Event handler called when the value of the toggle changes. | `[value: boolean]` |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `modelValue` | Current value | `boolean` |
| `state` | Current state | `"on" \| "off"` |
| `pressed` | Current pressed state | `boolean` |
| `disabled` | Current disabled state | `boolean` |

</llm-only>
