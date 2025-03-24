<!-- This file was automatic generated. Do not edit it manually -->

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
    'description': '<p>Change the default rendered element for the one passed as a child, merging their props and behavior.</p>\n<p>Read our <a href=\'https://www.radix-vue.com/guides/composition.html\'>Composition</a> guide for more details.</p>\n',
    'type': 'boolean',
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
    'description': '<p>The value of the combobox when initially rendered. Use when you do not need to control the state of the Combobox</p>\n',
    'type': 'AcceptableValue | AcceptableValue[]',
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
    'description': '<p>When <code>true</code>, prevents the user from interacting with Combobox</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'displayValue',
    'description': '<p>The display value of input for selected item. Does not work with <code>multiple</code>.</p>\n',
    'type': '((val: AcceptableValue) => string)',
    'required': false
  },
  {
    'name': 'filterFunction',
    'description': '<p>The custom filter function for filtering <code>ComboboxItem</code>.</p>\n',
    'type': '((val: string[] | number[] | false[] | true[] | Record<string, any>[], term: string) => string[] | number[] | false[] | true[] | Record<string, any>[])',
    'required': false
  },
    {
    'name': 'inputEnterFunction',
    'description': '<p>Custom function for handling combobox input enter event that preserves native event. By default, when user presses enter on <code>ComboboxInput</code>, the currently selected item is automatically selected, triggering a click event. This might not be ideal in some cases (example: search suggestions box), where pressing enter should trigger a different action. For such cases, you can provide a custom function to handle the enter event.</p>\n',
    'type': '((event: InputEvent, selectedValue: AcceptableValue | undefined) => void)',
    'required': false
  }
  {
    'name': 'modelValue',
    'description': '<p>The controlled value of the Combobox. Can be binded with with <code>v-model</code>.</p>\n',
    'type': 'AcceptableValue | AcceptableValue[]',
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
    'description': '<p>The name of the Combobox. Submitted with its owning form as part of a name/value pair.</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'open',
    'description': '<p>The controlled open state of the Combobox. Can be binded with with <code>v-model:open</code>.</p>\n',
    'type': 'boolean',
    'required': false
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
    'name': 'searchTerm',
    'description': '<p>The controlled search term of the Combobox. Can be binded with with v-model:searchTerm.</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'selectedValue',
    'description': '<p>The current highlighted value of the COmbobox. Can be binded with <code>v-model:selectedValue</code>.</p>\n',
    'type': 'AcceptableValue',
    'required': false
  }
]" />

<EmitsTable :data="[
  {
    'name': 'update:modelValue',
    'description': '<p>Event handler called when the value changes.</p>\n',
    'type': '[value: AcceptableValue]'
  },
  {
    'name': 'update:open',
    'description': '<p>Event handler called when the open state of the combobox changes.</p>\n',
    'type': '[value: boolean]'
  },
  {
    'name': 'update:searchTerm',
    'description': '<p>Event handler called when the searchTerm of the combobox changes.</p>\n',
    'type': '[value: string]'
  },
  {
    'name': 'update:selectedValue',
    'description': '<p>Event handler called when the highlighted value of the combobox changes</p>\n',
    'type': '[value: AcceptableValue]'
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
    'type': 'AcceptableValue | AcceptableValue[]'
  }
]" />
