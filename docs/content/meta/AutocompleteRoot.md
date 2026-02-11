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
    'description': '<p>Change the default rendered element for the one passed as a child, merging their props and behavior.</p>\n<p>Read our <a href=\'https://www.reka-ui.com/docs/guides/composition\'>Composition</a> guide for more details.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'defaultOpen',
    'description': '<p>The open state of the autocomplete when it is initially rendered. Use when you do not need to control its open state.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'defaultValue',
    'description': '<p>The value of the autocomplete when initially rendered. Use when you do not need to control the state.</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'dir',
    'description': '<p>The reading direction of the autocomplete when applicable.</p>\n',
    'type': '\'ltr\' | \'rtl\'',
    'required': false
  },
  {
    'name': 'disabled',
    'description': '<p>When <code>true</code>, prevents the user from interacting with autocomplete</p>\n',
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
    'description': '<p>The controlled value of the Autocomplete (the input text). Can be bound with <code>v-model</code>.</p>\n',
    'type': 'string',
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
    'description': '<p>The controlled open state of the Autocomplete. Can be bound with <code>v-model:open</code>.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'openOnClick',
    'description': '<p>Whether to open the autocomplete when the input is clicked</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'openOnFocus',
    'description': '<p>Whether to open the autocomplete when the input is focused</p>\n',
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
    'name': 'resetSearchTermOnBlur',
    'description': '<p>Whether to reset the searchTerm when the Autocomplete input blurred</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  }
]" />

<EmitsTable :data="[
  {
    'name': 'highlight',
    'description': '<p>Event handler when highlighted element changes.</p>\n',
    'type': '[payload: { ref: HTMLElement; value: string; }]'
  },
  {
    'name': 'update:modelValue',
    'description': '<p>Event handler called when the value changes.</p>\n',
    'type': '[value: string]'
  },
  {
    'name': 'update:open',
    'description': '<p>Event handler called when the open state of the autocomplete changes.</p>\n',
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
    'type': 'string'
  }
]" />
