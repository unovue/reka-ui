<!-- This file was automatic generated. Do not edit it manually -->

<PropsTable :data="[
  {
    'name': 'addOnBlur',
    'description': '<p>When <code>true</code> allow adding tags blur input</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'addOnPaste',
    'description': '<p>When <code>true</code>, allow adding tags on paste. Work in conjunction with delimiter prop.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'addOnTab',
    'description': '<p>When <code>true</code> allow adding tags on tab keydown</p>\n',
    'type': 'boolean',
    'required': false
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
    'name': 'convertValue',
    'description': '<p>Convert the input value to the desired type. Mandatory when using objects as values and using <code>TagsInputInput</code></p>\n',
    'type': '((value: string) => AcceptableInputValue)',
    'required': false
  },
  {
    'name': 'defaultValue',
    'description': '<p>The value of the tags that should be added. Use when you do not need to control the state of the tags input</p>\n',
    'type': 'AcceptableInputValue[]',
    'required': false,
    'default': '[]'
  },
  {
    'name': 'delimiter',
    'description': '<p>The character or regular expression to trigger the addition of a new tag. Also used to split tags for <code>@paste</code> event</p>\n',
    'type': 'string | RegExp',
    'required': false,
    'default': '\',\''
  },
  {
    'name': 'dir',
    'description': '<p>The reading direction of the combobox when applicable. &lt;br&gt; If omitted, inherits globally from <code>ConfigProvider</code> or assumes LTR (left-to-right) reading mode.</p>\n',
    'type': '\'ltr\' | \'rtl\'',
    'required': false
  },
  {
    'name': 'disabled',
    'description': '<p>When <code>true</code>, prevents the user from interacting with the tags input.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'displayValue',
    'description': '<p>Display the value of the tag. Useful when you want to apply modifications to the value like adding a suffix or when using object as values</p>\n',
    'type': '((value: AcceptableInputValue) => string)',
    'required': false,
    'default': 'value.toString()'
  },
  {
    'name': 'duplicate',
    'description': '<p>When <code>true</code>, allow duplicated tags.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'id',
    'description': '',
    'type': 'string',
    'required': false
  },
  {
    'name': 'max',
    'description': '<p>Maximum number of tags.</p>\n',
    'type': 'number',
    'required': false,
    'default': '0'
  },
  {
    'name': 'modelValue',
    'description': '<p>The controlled value of the tags input. Can be bind as <code>v-model</code>.</p>\n',
    'type': 'AcceptableInputValue[] | null',
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
  }
]" />

<EmitsTable :data="[
  {
    'name': 'addTag',
    'description': '<p>Event handler called when tag is added</p>\n',
    'type': '[payload: AcceptableInputValue]'
  },
  {
    'name': 'invalid',
    'description': '<p>Event handler called when the value is invalid</p>\n',
    'type': '[payload: AcceptableInputValue]'
  },
  {
    'name': 'removeTag',
    'description': '<p>Event handler called when tag is removed</p>\n',
    'type': '[payload: AcceptableInputValue]'
  },
  {
    'name': 'update:modelValue',
    'description': '<p>Event handler called when the value changes</p>\n',
    'type': '[payload: AcceptableInputValue[]]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'modelValue',
    'description': '<p>Current input values</p>\n',
    'type': 'string | Record<string, any>'
  }
]" />
