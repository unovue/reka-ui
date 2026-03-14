<!-- This file was automatically generated. Do not edit it manually -->

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
    'description': '<p>The state of the switch when it is initially rendered. Use when you do not need to control its state.</p>\n',
    'type': 'unknown',
    'required': false
  },
  {
    'name': 'disabled',
    'description': '<p>When <code>true</code>, prevents the user from interacting with the switch.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'falseValue',
    'description': '<p>The value used when the switch is off. Defaults to <code>false</code>.</p>\n',
    'type': 'unknown',
    'required': false,
    'default': '(() => false) as unknown as undefined'
  },
  {
    'name': 'id',
    'description': '',
    'type': 'string',
    'required': false
  },
  {
    'name': 'modelValue',
    'description': '<p>The controlled state of the switch. Can be bind as <code>v-model</code>.</p>\n',
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
    'description': '<p>The value used when the switch is on. Defaults to <code>true</code>.</p>\n',
    'type': 'unknown',
    'required': false,
    'default': '(() => true) as unknown as undefined'
  },
  {
    'name': 'value',
    'description': '<p>The value given as data when submitted with a <code>name</code>.</p>\n',
    'type': 'string',
    'required': false,
    'default': '\'on\''
  }
]" />

<EmitsTable :data="[
  {
    'name': 'update:modelValue',
    'description': '<p>Event handler called when the value of the switch changes.</p>\n',
    'type': '[payload: unknown]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'modelValue',
    'description': '<p>Current value</p>\n',
    'type': 'unknown'
  },
  {
    'name': 'checked',
    'description': '<p>Whether the switch is checked</p>\n',
    'type': 'boolean'
  }
]" />
