<!-- This file was automatically generated. Do not edit it manually -->

<llm-exclude>
<PropsTable :data="[
  {
    'name': 'autocomplete',
    'description': '<p>Native html input <code>autocomplete</code> attribute.</p>\n',
    'type': 'string',
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
    'description': '<p>The open state of the select when it is initially rendered. Use when you do not need to control its open state.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'defaultValue',
    'description': '<p>The value of the select when initially rendered. Use when you do not need to control the state of the Select</p>\n',
    'type': 'T | T[]',
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
    'description': '<p>When <code>true</code>, prevents the user from interacting with Select</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'displayValue',
    'description': '<p>The text shown for a selected value. Wins over the text of its <code>SelectItemText</code>, so the value can be shown before\nthe content ever rendered; with it set, the closed content is not rendered just to collect the item texts. The cost:\nuntil the content has been opened once, the hidden native <code>select</code> only holds the selected values (so browser\nautofill cannot pick another one) and the closed trigger\'s typeahead has no items to match.</p>\n',
    'type': '((value: T) =&gt; string)',
    'required': false
  },
  {
    'name': 'getNavigationIntent',
    'description': '<p>Resolves what a keydown in the content means for keyboard navigation. Return <code>undefined</code> to fall back to the\ndefault mapping (ArrowUp, ArrowDown, Home, End), <code>null</code> to opt the key out (for Enter and Space this also skips the\nselection), or <code>\'select\'</code> to select the focused item as Enter does.</p>\n',
    'type': '((event: KeyboardEvent) =&gt; ListboxNavigationIntent | null | undefined)',
    'required': false
  },
  {
    'name': 'modelValue',
    'description': '<p>The controlled value of the Select. Can be bind as <code>v-model</code>.</p>\n',
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
    'name': 'nullableValue',
    'description': '<p>The value of the hidden native select option when the model value is nullish.</p>\n',
    'type': 'string',
    'required': false,
    'default': '\'\''
  },
  {
    'name': 'open',
    'description': '<p>The controlled open state of the Select. Can be bind as <code>v-model:open</code>.</p>\n',
    'type': 'boolean',
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
    'name': 'beforeUpdate:modelValue',
    'description': '<p>Event handler called before the value changes; call <code>details.cancel()</code> to keep the current value. The value is an\narray when <code>multiple</code>.</p>\n',
    'type': '[value: SelectModelValue&lt;T, M&gt;, details: ChangeEventDetails&lt;SelectChangeReason, Event&gt;]'
  },
  {
    'name': 'beforeUpdate:open',
    'description': '<p>Event handler called before the open state changes; call <code>details.cancel()</code> to keep it.</p>\n',
    'type': '[value: boolean, details: ChangeEventDetails&lt;SelectOpenChangeReason, Event&gt;]'
  },
  {
    'name': 'update:modelValue',
    'description': '<p>Event handler called when the value changes. The value is an array when <code>multiple</code>.</p>\n',
    'type': '[value: SelectModelValue&lt;T, M&gt;, details: ChangeEventDetails&lt;SelectChangeReason, Event&gt;]'
  },
  {
    'name': 'update:open',
    'description': '<p>Event handler called when the open state of the select changes.</p>\n',
    'type': '[value: boolean, details: ChangeEventDetails&lt;SelectOpenChangeReason, Event&gt;]'
  },
  {
    'name': 'update:openComplete',
    'description': '<p>Event handler called after the open or close animations of the content have finished.</p>\n',
    'type': '[value: boolean]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'modelValue',
    'description': '<p>Current input values; <code>undefined</code> while a single select is empty</p>\n',
    'type': 'M extends true ? T[] : T | undefined'
  },
  {
    'name': 'open',
    'description': '<p>Current open state</p>\n',
    'type': 'boolean'
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `autocomplete` | Native html input autocomplete attribute. | `string` | No | - |
| `by` | Use this to compare objects by a particular field, or pass your own comparison function for complete control over how objects are compared. | `string \| ((a: T, b: T) => boolean)` | No | - |
| `defaultOpen` | The open state of the select when it is initially rendered. Use when you do not need to control its open state. | `boolean` | No | - |
| `defaultValue` | The value of the select when initially rendered. Use when you do not need to control the state of the Select | `T \| T[]` | No | - |
| `dir` | The reading direction of the combobox when applicable. <br> If omitted, inherits globally from ConfigProvider or assumes LTR (left-to-right) reading mode. | `"ltr" \| "rtl"` | No | - |
| `disabled` | When true, prevents the user from interacting with Select | `boolean` | No | - |
| `displayValue` | The text shown for a selected value. Wins over the text of its SelectItemText, so the value can be shown before the content ever rendered; with it set, the closed content is not rendered just to collect the item texts. The cost: until the content has been opened once, the hidden native select only holds the selected values (so browser autofill cannot pick another one) and the closed trigger's typeahead has no items to match. | `((value: T) => string)` | No | - |
| `getNavigationIntent` | Resolves what a keydown in the content means for keyboard navigation. Return undefined to fall back to the default mapping (ArrowUp, ArrowDown, Home, End), null to opt the key out (for Enter and Space this also skips the selection), or 'select' to select the focused item as Enter does. | `((event: KeyboardEvent) => ListboxNavigationIntent \| null \| undefined)` | No | - |
| `modelValue` | The controlled value of the Select. Can be bind as v-model. | `T \| T[]` | No | - |
| `multiple` | Whether multiple options can be selected or not. | `boolean` | No | - |
| `name` | The name of the field. Submitted with its owning form as part of a name/value pair. | `string` | No | - |
| `nullableValue` | The value of the hidden native select option when the model value is nullish. | `string` | No | `""` |
| `open` | The controlled open state of the Select. Can be bind as v-model:open. | `boolean` | No | - |
| `required` | When true, indicates that the user must set the value before the owning form can be submitted. | `boolean` | No | - |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `beforeUpdate:modelValue` | Event handler called before the value changes; call details.cancel() to keep the current value. The value is an array when multiple. | `[value: SelectModelValue<T, M>, details: ChangeEventDetails<SelectChangeReason, Event>]` |
| `beforeUpdate:open` | Event handler called before the open state changes; call details.cancel() to keep it. | `[value: boolean, details: ChangeEventDetails<SelectOpenChangeReason, Event>]` |
| `update:modelValue` | Event handler called when the value changes. The value is an array when multiple. | `[value: SelectModelValue<T, M>, details: ChangeEventDetails<SelectChangeReason, Event>]` |
| `update:open` | Event handler called when the open state of the select changes. | `[value: boolean, details: ChangeEventDetails<SelectOpenChangeReason, Event>]` |
| `update:openComplete` | Event handler called after the open or close animations of the content have finished. | `[value: boolean]` |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `modelValue` | Current input values; undefined while a single select is empty | `M extends true ? T[] : T \| undefined` |
| `open` | Current open state | `boolean` |

</llm-only>
