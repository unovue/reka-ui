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
    'name': 'completed',
    'description': '<p>Shows whether the step is completed.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'disabled',
    'description': '<p>When <code>true</code>, prevents the user from interacting with the step.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'step',
    'description': '<p>A unique value that associates the stepper item with an index</p>\n',
    'type': 'number',
    'required': true
  }
]" />

<SlotsTable :data="[
  {
    'name': 'state',
    'description': '<p>The state of the stepper item: <code>completed</code>, <code>current</code> or <code>upcoming</code></p>\n',
    'type': '\'completed\' | \'current\' | \'upcoming\''
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `as` | The element or component this component should render as. Can be overwritten by asChild. | `AsTag \| Component` | No | `"div"` |
| `asChild` | Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details. | `boolean` | No | - |
| `completed` | Shows whether the step is completed. | `boolean` | No | `false` |
| `disabled` | When true, prevents the user from interacting with the step. | `boolean` | No | `false` |
| `step` | A unique value that associates the stepper item with an index | `number` | Yes | - |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `state` | The state of the stepper item: completed, current or upcoming | `"completed" \| "current" \| "upcoming"` |

</llm-only>
