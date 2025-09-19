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
    'name': 'defaultValue',
    'description': '<p>The default value of the pin inputs when it is initially rendered. Use when you do not need to control its checked state.</p>\n',
    'type': 'string[][]',
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
    'description': '<p>When <code>true</code>, prevents the user from interacting with the pin input</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'id',
    'description': '<p>Id of the element</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'mask',
    'description': '<p>When <code>true</code>, pin inputs will be treated as password.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'modelValue',
    'description': '<p>The controlled checked state of the pin input. Can be binded as <code>v-model</code>.</p>\n',
    'type': 'string[] | null',
    'required': false
  },
  {
    'name': 'name',
    'description': '<p>The name of the field. Submitted with its owning form as part of a name/value pair.</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'otp',
    'description': '<p>When <code>true</code>, mobile devices will autodetect the OTP from messages or clipboard, and enable the autocomplete field.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'placeholder',
    'description': '<p>The placeholder character to use for empty pin-inputs.</p>\n',
    'type': 'string',
    'required': false,
    'default': '\'\''
  },
  {
    'name': 'required',
    'description': '<p>When <code>true</code>, indicates that the user must set the value before the owning form can be submitted.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'type',
    'description': '<p>Input type for the inputs.</p>\n',
    'type': '\'number\' | \'text\'',
    'required': false,
    'default': '\'text\' as any'
  }
]" />

<EmitsTable :data="[
  {
    'name': 'complete',
    'description': '',
    'type': '[value: string[]]'
  },
  {
    'name': 'update:modelValue',
    'description': '<p>Event handler called when the value changes.</p>\n',
    'type': '[value: string[]]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'modelValue',
    'description': '<p>Current input values</p>\n',
    'type': 'string[]'
  }
]" />
