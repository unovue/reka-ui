<!-- This file was automatic generated. Do not edit it manually -->

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
    'type': 'string | ((a: AcceptableValue, b: AcceptableValue) => boolean)',
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
    'description': '<p>When <code>true</code>, prevents the user from interacting with Select</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'modelValue',
    'description': '<p>The controlled value of the Select. Can be bind as <code>v-model</code>.</p>\n',
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
    'description': '<p>The name of the field. Submitted with its owning form as part of a name/value pair.</p>\n',
    'type': 'string',
    'required': false
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
    'name': 'update:modelValue',
    'description': '<p>Event handler called when the value changes.</p>\n',
    'type': '[value: AcceptableValue]'
  },
  {
    'name': 'update:open',
    'description': '<p>Event handler called when the open state of the context menu changes.</p>\n',
    'type': '[value: boolean]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'modelValue',
    'description': '<p>Current input values</p>\n',
    'type': 'AcceptableValue | AcceptableValue[] | undefined'
  },
  {
    'name': 'open',
    'description': '<p>Current open state</p>\n',
    'type': 'boolean'
  }
]" />
