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
    'description': '<p>Use this to compare objects by a particular field, or pass your own comparison function for complete control over how values are compared (a function runs for every value, strings included). Read once at setup: changing it after mount has no effect.</p>\n',
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
    'description': '<p>The value of the Combobox when initially rendered. Use when you do not need to control the state of the Combobox.</p>\n',
    'type': 'T | T[] | null',
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
    'name': 'displayValue',
    'description': '<p>The text the input shows for the selected value of a single combobox, when <code>ComboboxInput</code> has no <code>displayValue</code>\nof its own. Without either, a primitive value shows as its string form and an object value as an empty input.</p>\n',
    'type': '((value: T) =&gt; string)',
    'required': false
  },
  {
    'name': 'filter',
    'description': '<p>Whether an item matches the search term: called as <code>filter(text, search, value)</code> with the item\'s <code>textValue</code> (or\nits text content; in a <code>ComboboxVirtualizer</code>, <code>textContent(option)</code>). Omitted, items are matched with <code>useFilter</code>\'s\n<code>contains</code> (base sensitivity). <code>null</code> turns client filtering off: filter the items yourself, or on a server.</p>\n',
    'type': 'ListboxFilterFunction&lt;T&gt; | null',
    'required': false
  },
  {
    'name': 'getNavigationIntent',
    'description': '<p>Resolves what a keydown in the input means for keyboard navigation. Return <code>undefined</code> to fall back to the default\nmapping, <code>null</code> to opt the key out (for Enter this also skips the selection), or <code>\'select\'</code> to select the\nhighlighted item as Enter does. A <code>\'next\'</code> or <code>\'prev\'</code> intent also opens a closed popup. Unmodified printable keys,\nArrowLeft and ArrowRight always stay text input.</p>\n',
    'type': '((event: KeyboardEvent) =&gt; ListboxNavigationIntent | null)',
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
    'description': '<p>Deprecated alias for <code>:filter=&quot;null&quot;</code>: when <code>true</code>, turns client filtering off. Wins over <code>filter</code>.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'loop',
    'description': '<p>When <code>true</code>, keyboard navigation will loop from last item to first, and vice versa.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'modelValue',
    'description': '<p>The controlled value of the Combobox. Can be binded with <code>v-model</code>. An array when <code>multiple</code>; <code>null</code> is an empty\nsingle selection, the value <code>ComboboxCancel</code> emits when it clears one.</p>\n',
    'type': 'T | T[] | null',
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
  },
  {
    'name': 'unmountOnHide',
    'description': '<p>When set to <code>false</code>, the Combobox content will not be unmounted when closed, but instead hidden with CSS. &lt;br&gt;\nUseful when you want to improve performance by not remounting the content on every open.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'true'
  }
]" />

<EmitsTable :data="[
  {
    'name': 'beforeUpdate:modelValue',
    'description': '<p>Event handler called before the value changes; call <code>details.cancel()</code> to keep the current value. The value is an array when <code>multiple</code>, and <code>undefined</code> when a single selection is cleared.</p>\n',
    'type': '[value: ComboboxModelValue&lt;T, M&gt;, details: ChangeEventDetails&lt;ComboboxChangeReason, Event&gt;]'
  },
  {
    'name': 'beforeUpdate:open',
    'description': '<p>Event handler called before the open state changes; call <code>details.cancel()</code> to keep it.</p>\n',
    'type': '[value: boolean, details: ChangeEventDetails&lt;ComboboxOpenChangeReason, Event&gt;]'
  },
  {
    'name': 'highlight',
    'description': '<p>Event handler when highlighted element changes.</p>\n',
    'type': '[payload: { ref: HTMLElement; value: T; } | undefined]'
  },
  {
    'name': 'update:modelValue',
    'description': '<p>Event handler called when the value changes.</p>\n',
    'type': '[value: ComboboxModelValue&lt;T, M&gt;, details: ChangeEventDetails&lt;ComboboxChangeReason, Event&gt;]'
  },
  {
    'name': 'update:open',
    'description': '<p>Event handler called when the open state of the combobox changes.</p>\n',
    'type': '[value: boolean, details: ChangeEventDetails&lt;ComboboxOpenChangeReason, Event&gt;]'
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
    'type': 'ComboboxModelValue&lt;T, M&gt;'
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `as` | The element or component this component should render as. Can be overwritten by asChild. | `AsTag \| Component` | No | `"div"` |
| `asChild` | Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details. | `boolean` | No | - |
| `by` | Use this to compare objects by a particular field, or pass your own comparison function for complete control over how values are compared (a function runs for every value, strings included). Read once at setup: changing it after mount has no effect. | `string \| ((a: T, b: T) => boolean)` | No | - |
| `defaultOpen` | The open state of the combobox when it is initially rendered. <br> Use when you do not need to control its open state. | `boolean` | No | - |
| `defaultValue` | The value of the Combobox when initially rendered. Use when you do not need to control the state of the Combobox. | `T \| T[] \| null` | No | - |
| `dir` | The reading direction of the listbox when applicable. <br> If omitted, inherits globally from ConfigProvider or assumes LTR (left-to-right) reading mode. | `"ltr" \| "rtl"` | No | - |
| `disabled` | When true, prevents the user from interacting with listbox | `boolean` | No | - |
| `displayValue` | The text the input shows for the selected value of a single combobox, when ComboboxInput has no displayValue of its own. Without either, a primitive value shows as its string form and an object value as an empty input. | `((value: T) => string)` | No | - |
| `filter` | Whether an item matches the search term: called as filter(text, search, value) with the item's textValue (or its text content; in a ComboboxVirtualizer, textContent(option)). Omitted, items are matched with useFilter's contains (base sensitivity). null turns client filtering off: filter the items yourself, or on a server. | `ListboxFilterFunction<T> \| null` | No | - |
| `getNavigationIntent` | Resolves what a keydown in the input means for keyboard navigation. Return undefined to fall back to the default mapping, null to opt the key out (for Enter this also skips the selection), or 'select' to select the highlighted item as Enter does. A 'next' or 'prev' intent also opens a closed popup. Unmodified printable keys, ArrowLeft and ArrowRight always stay text input. | `((event: KeyboardEvent) => ListboxNavigationIntent \| null)` | No | - |
| `highlightOnHover` | When true, hover over item will trigger highlight | `boolean` | No | `true` |
| `ignoreFilter` | Deprecated alias for :filter="null": when true, turns client filtering off. Wins over filter. | `boolean` | No | - |
| `loop` | When true, keyboard navigation will loop from last item to first, and vice versa. | `boolean` | No | - |
| `modelValue` | The controlled value of the Combobox. Can be binded with v-model. An array when multiple; null is an empty single selection, the value ComboboxCancel emits when it clears one. | `T \| T[] \| null` | No | - |
| `multiple` | Whether multiple options can be selected or not. | `boolean` | No | - |
| `name` | The name of the field. Submitted with its owning form as part of a name/value pair. | `string` | No | - |
| `open` | The controlled open state of the Combobox. Can be binded with v-model:open. | `boolean` | No | - |
| `openOnClick` | Whether to open the combobox when the input is clicked | `boolean` | No | `false` |
| `openOnFocus` | Whether to open the combobox when the input is focused | `boolean` | No | `false` |
| `required` | When true, indicates that the user must set the value before the owning form can be submitted. | `boolean` | No | - |
| `resetModelValueOnClear` | When true the modelValue will be reset to null (or [] if multiple) | `boolean` | No | `false` |
| `resetSearchTermOnBlur` | Whether to reset the searchTerm when the Combobox input blurred | `boolean` | No | `true` |
| `resetSearchTermOnSelect` | Whether to reset the searchTerm when the Combobox value is selected | `boolean` | No | `true` |
| `unmountOnHide` | When set to false, the Combobox content will not be unmounted when closed, but instead hidden with CSS. <br> Useful when you want to improve performance by not remounting the content on every open. | `boolean` | No | `true` |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `beforeUpdate:modelValue` | Event handler called before the value changes; call details.cancel() to keep the current value. The value is an array when multiple, and undefined when a single selection is cleared. | `[value: ComboboxModelValue<T, M>, details: ChangeEventDetails<ComboboxChangeReason, Event>]` |
| `beforeUpdate:open` | Event handler called before the open state changes; call details.cancel() to keep it. | `[value: boolean, details: ChangeEventDetails<ComboboxOpenChangeReason, Event>]` |
| `highlight` | Event handler when highlighted element changes. | `[payload: { ref: HTMLElement; value: T; } \| undefined]` |
| `update:modelValue` | Event handler called when the value changes. | `[value: ComboboxModelValue<T, M>, details: ChangeEventDetails<ComboboxChangeReason, Event>]` |
| `update:open` | Event handler called when the open state of the combobox changes. | `[value: boolean, details: ChangeEventDetails<ComboboxOpenChangeReason, Event>]` |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `open` | Current open state | `boolean` |
| `modelValue` | Current active value | `ComboboxModelValue<T, M>` |

</llm-only>
