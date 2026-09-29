<!-- This file was automatically generated. Do not edit it manually -->

<llm-exclude>
<PropsTable :data="[
  {
    'name': 'activationMode',
    'description': '<p>The activation event of the editable field</p>\n',
    'type': '\'dblclick\' | \'focus\' | \'none\'',
    'required': false,
    'default': '\'focus\''
  },
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
    'name': 'autoResize',
    'description': '<p>Whether the editable field should auto resize</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'defaultValue',
    'description': '<p>The default value of the editable field</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'dir',
    'description': '<p>The reading direction of the calendar when applicable. &lt;br&gt; If omitted, inherits globally from <code>ConfigProvider</code> or assumes LTR (left-to-right) reading mode.</p>\n',
    'type': '\'ltr\' | \'rtl\'',
    'required': false
  },
  {
    'name': 'disabled',
    'description': '<p>Whether the editable field is disabled</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'id',
    'description': '<p>The id of the field</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'maxLength',
    'description': '<p>The maximum number of characters allowed</p>\n',
    'type': 'number',
    'required': false
  },
  {
    'name': 'modelValue',
    'description': '<p>The value of the editable field</p>\n',
    'type': 'string | null',
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
    'description': '<p>The placeholder for the editable field</p>\n',
    'type': 'string | { edit: string; preview: string; }',
    'required': false,
    'default': '\'Enter text...\''
  },
  {
    'name': 'readonly',
    'description': '<p>Whether the editable field is read-only</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'required',
    'description': '<p>When <code>true</code>, indicates that the user must set the value before the owning form can be submitted.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'selectOnFocus',
    'description': '<p>Whether to select the text in the input when it is focused.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'startWithEditMode',
    'description': '<p>Whether to start with the edit mode active</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'submitMode',
    'description': '<p>The submit event of the editable field</p>\n',
    'type': '\'blur\' | \'none\' | \'enter\' | \'both\'',
    'required': false,
    'default': '\'blur\''
  }
]" />

<EmitsTable :data="[
  {
    'name': 'submit',
    'description': '<p>Event handler called when a value is submitted</p>\n',
    'type': '[value: string | null]'
  },
  {
    'name': 'update:modelValue',
    'description': '<p>Event handler called whenever the model value changes</p>\n',
    'type': '[value: string]'
  },
  {
    'name': 'update:state',
    'description': '<p>Event handler called when the editable field changes state</p>\n',
    'type': '[state: \'cancel\' | \'submit\' | \'edit\']'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'isEditing',
    'description': '<p>Whether the editable field is in edit mode</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'modelValue',
    'description': '<p>The value of the editable field</p>\n',
    'type': 'string | null | undefined'
  },
  {
    'name': 'isEmpty',
    'description': '<p>Whether the editable field is empty</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'submit',
    'description': '<p>Function to submit the value of the editable</p>\n',
    'type': '(): void'
  },
  {
    'name': 'cancel',
    'description': '<p>Function to cancel the value of the editable</p>\n',
    'type': '(): void'
  },
  {
    'name': 'edit',
    'description': '<p>Function to set the editable in edit mode</p>\n',
    'type': '(): void'
  }
]" />

<MethodsTable :data="[
  {
    'name': 'submit',
    'description': '<p>Function to submit the value of the editable</p>\n',
    'type': '() =&gt; void'
  },
  {
    'name': 'cancel',
    'description': '<p>Function to cancel the value of the editable</p>\n',
    'type': '() =&gt; void'
  },
  {
    'name': 'edit',
    'description': '<p>Function to set the editable in edit mode</p>\n',
    'type': '() =&gt; void'
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `activationMode` | The activation event of the editable field | `"dblclick" \| "focus" \| "none"` | No | `"focus"` |
| `as` | The element or component this component should render as. Can be overwritten by asChild. | `AsTag \| Component` | No | `"div"` |
| `asChild` | Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details. | `boolean` | No | - |
| `autoResize` | Whether the editable field should auto resize | `boolean` | No | `false` |
| `defaultValue` | The default value of the editable field | `string` | No | - |
| `dir` | The reading direction of the calendar when applicable. <br> If omitted, inherits globally from ConfigProvider or assumes LTR (left-to-right) reading mode. | `"ltr" \| "rtl"` | No | - |
| `disabled` | Whether the editable field is disabled | `boolean` | No | `false` |
| `id` | The id of the field | `string` | No | - |
| `maxLength` | The maximum number of characters allowed | `number` | No | - |
| `modelValue` | The value of the editable field | `string \| null` | No | - |
| `name` | The name of the field. Submitted with its owning form as part of a name/value pair. | `string` | No | - |
| `placeholder` | The placeholder for the editable field | `string \| { edit: string; preview: string; }` | No | `"Enter text..."` |
| `readonly` | Whether the editable field is read-only | `boolean` | No | - |
| `required` | When true, indicates that the user must set the value before the owning form can be submitted. | `boolean` | No | `false` |
| `selectOnFocus` | Whether to select the text in the input when it is focused. | `boolean` | No | `false` |
| `startWithEditMode` | Whether to start with the edit mode active | `boolean` | No | - |
| `submitMode` | The submit event of the editable field | `"blur" \| "none" \| "enter" \| "both"` | No | `"blur"` |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `submit` | Event handler called when a value is submitted | `[value: string \| null]` |
| `update:modelValue` | Event handler called whenever the model value changes | `[value: string]` |
| `update:state` | Event handler called when the editable field changes state | `[state: "cancel" \| "submit" \| "edit"]` |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `isEditing` | Whether the editable field is in edit mode | `boolean` |
| `modelValue` | The value of the editable field | `string \| null \| undefined` |
| `isEmpty` | Whether the editable field is empty | `boolean` |
| `submit` | Function to submit the value of the editable | `(): void` |
| `cancel` | Function to cancel the value of the editable | `(): void` |
| `edit` | Function to set the editable in edit mode | `(): void` |

**Methods**

| Name | Description | Type |
| --- | --- | --- |
| `submit` | Function to submit the value of the editable | `() => void` |
| `cancel` | Function to cancel the value of the editable | `() => void` |
| `edit` | Function to set the editable in edit mode | `() => void` |

</llm-only>
