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
    'name': 'by',
    'description': '<p>Use this to compare objects by a particular field, or pass your own comparison function for complete control over how objects are compared.</p>\n',
    'type': 'string | ((a: T, b: T) =&gt; boolean)',
    'required': false
  },
  {
    'name': 'defaultOpen',
    'description': '<p>The open state of the combobox when it is initially rendered. &lt;br&gt; Use when you do not need to control its open state.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'defaultValue',
    'description': '<p>The value of the listbox when initially rendered. Use when you do not need to control the state of the Listbox</p>\n',
    'type': 'T | T[]',
    'required': false
  },
  {
    'name': 'dir',
    'description': '<p>The reading direction of the listbox when applicable. &lt;br&gt; If omitted, inherits globally from <code>ConfigProvider</code> or assumes LTR (left-to-right) reading mode.</p>\n',
    'type': '\'ltr\' | \'rtl\'',
    'required': false
  },
  {
    'name': 'disabled',
    'description': '<p>When <code>true</code>, prevents the user from interacting with listbox</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'highlightOnHover',
    'description': '<p>When <code>true</code>, hover over item will trigger highlight</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'true'
  },
  {
    'name': 'ignoreFilter',
    'description': '<p>When <code>true</code>, disable the default filters</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'modelValue',
    'description': '<p>The controlled value of the listbox. Can be binded with <code>v-model</code>.</p>\n',
    'type': 'T | T[]',
    'required': false
  },
  {
    'name': 'multiple',
    'description': '<p>Whether multiple options can be selected or not.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'name',
    'description': '<p>The name of the field. Submitted with its owning form as part of a name/value pair.</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'open',
    'description': '<p>The controlled open state of the Combobox. Can be binded with <code>v-model:open</code>.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'openOnClick',
    'description': '<p>Whether to open the combobox when the input is clicked</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'openOnFocus',
    'description': '<p>Whether to open the combobox when the input is focused</p>\n',
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
    'name': 'resetModelValueOnClear',
    'description': '<p>When <code>true</code> the <code>modelValue</code> will be reset to <code>null</code> (or <code>[]</code> if <code>multiple</code>)</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'resetSearchTermOnBlur',
    'description': '<p>Whether to reset the searchTerm when the Combobox input blurred</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'true'
  },
  {
    'name': 'resetSearchTermOnSelect',
    'description': '<p>Whether to reset the searchTerm when the Combobox value is selected</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'true'
  }
]" />

<EmitsTable :data="[
  {
    'name': 'highlight',
    'description': '<p>Event handler when highlighted element changes.</p>\n',
    'type': '[payload: { ref: HTMLElement; value: T; }]'
  },
  {
    'name': 'update:modelValue',
    'description': '<p>Event handler called when the value changes.</p>\n',
    'type': '[value: T]'
  },
  {
    'name': 'update:open',
    'description': '<p>Event handler called when the open state of the combobox changes.</p>\n',
    'type': '[value: boolean]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'open',
    'description': '<p>Current open state</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'modelValue',
    'description': '<p>Current active value</p>\n',
    'type': 'T | T[]'
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `as` | The element or component this component should render as. Can be overwritten by asChild. | `AsTag \| Component` | No | `"div"` |
| `asChild` | Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details. | `boolean` | No | - |
| `by` | Use this to compare objects by a particular field, or pass your own comparison function for complete control over how objects are compared. | `string \| ((a: T, b: T) => boolean)` | No | - |
| `defaultOpen` | The open state of the combobox when it is initially rendered. <br> Use when you do not need to control its open state. | `boolean` | No | - |
| `defaultValue` | The value of the listbox when initially rendered. Use when you do not need to control the state of the Listbox | `T \| T[]` | No | - |
| `dir` | The reading direction of the listbox when applicable. <br> If omitted, inherits globally from ConfigProvider or assumes LTR (left-to-right) reading mode. | `"ltr" \| "rtl"` | No | - |
| `disabled` | When true, prevents the user from interacting with listbox | `boolean` | No | - |
| `highlightOnHover` | When true, hover over item will trigger highlight | `boolean` | No | `true` |
| `ignoreFilter` | When true, disable the default filters | `boolean` | No | - |
| `modelValue` | The controlled value of the listbox. Can be binded with v-model. | `T \| T[]` | No | - |
| `multiple` | Whether multiple options can be selected or not. | `boolean` | No | - |
| `name` | The name of the field. Submitted with its owning form as part of a name/value pair. | `string` | No | - |
| `open` | The controlled open state of the Combobox. Can be binded with v-model:open. | `boolean` | No | - |
| `openOnClick` | Whether to open the combobox when the input is clicked | `boolean` | No | `false` |
| `openOnFocus` | Whether to open the combobox when the input is focused | `boolean` | No | `false` |
| `required` | When true, indicates that the user must set the value before the owning form can be submitted. | `boolean` | No | - |
| `resetModelValueOnClear` | When true the modelValue will be reset to null (or [] if multiple) | `boolean` | No | `false` |
| `resetSearchTermOnBlur` | Whether to reset the searchTerm when the Combobox input blurred | `boolean` | No | `true` |
| `resetSearchTermOnSelect` | Whether to reset the searchTerm when the Combobox value is selected | `boolean` | No | `true` |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `highlight` | Event handler when highlighted element changes. | `[payload: { ref: HTMLElement; value: T; }]` |
| `update:modelValue` | Event handler called when the value changes. | `[value: T]` |
| `update:open` | Event handler called when the open state of the combobox changes. | `[value: boolean]` |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `open` | Current open state | `boolean` |
| `modelValue` | Current active value | `T \| T[]` |

</llm-only>
