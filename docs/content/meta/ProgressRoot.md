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
    'name': 'getValueLabel',
    'description': '<p>A function to get the accessible label text representing the current value in a human-readable format.</p>\n<p>If not provided, the value label will be read as the numeric value as a percentage of the max value.</p>\n',
    'type': '((value: number | null | undefined, max: number) => string | undefined)',
    'required': false,
    'default': '`${Math.round((value / max) * DEFAULT_MAX)}%`'
  },
  {
    'name': 'max',
    'description': '<p>The maximum progress value.</p>\n',
    'type': 'number',
    'required': false,
    'default': 'DEFAULT_MAX'
  },
  {
    'name': 'modelValue',
    'description': '<p>The progress value. Can be bind as <code>v-model</code>.</p>\n',
    'type': 'number | null',
    'required': false
  }
]" />

<EmitsTable :data="[
  {
    'name': 'update:max',
    'description': '<p>Event handler called when the max value changes</p>\n',
    'type': '[value: number]'
  },
  {
    'name': 'update:modelValue',
    'description': '<p>Event handler called when the progress value changes</p>\n',
    'type': '[value: string[]]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'modelValue',
    'description': '<p>Current input values</p>\n',
    'type': 'number | null | undefined'
  }
]" />

<MethodsTable :data="[
  {
    'name': 'getValueLabel',
    'description': '<p>A function to get the accessible label text representing the current value in a human-readable format.</p>\n<p>If not provided, the value label will be read as the numeric value as a percentage of the max value.</p>\n',
    'type': '(value: number | null | undefined, max: number) => string | undefined'
  }
]" />
