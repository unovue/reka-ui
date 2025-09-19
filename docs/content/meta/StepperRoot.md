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
    'description': '<p>The value of the step that should be active when initially rendered. Use when you do not need to control the state of the steps.</p>\n',
    'type': 'number',
    'required': false,
    'default': '1'
  },
  {
    'name': 'dir',
    'description': '<p>The reading direction of the combobox when applicable. &lt;br&gt; If omitted, inherits globally from <code>ConfigProvider</code> or assumes LTR (left-to-right) reading mode.</p>\n',
    'type': '\'ltr\' | \'rtl\'',
    'required': false
  },
  {
    'name': 'linear',
    'description': '<p>Whether or not the steps must be completed in order.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'true'
  },
  {
    'name': 'modelValue',
    'description': '<p>The controlled value of the step to activate. Can be bound as <code>v-model</code>.</p>\n',
    'type': 'number',
    'required': false
  },
  {
    'name': 'orientation',
    'description': '<p>The orientation the steps are laid out.\nMainly so arrow navigation is done accordingly (left &amp; right vs. up &amp; down).</p>\n',
    'type': '\'vertical\' | \'horizontal\'',
    'required': false,
    'default': '\'horizontal\''
  }
]" />

<EmitsTable :data="[
  {
    'name': 'update:modelValue',
    'description': '<p>Event handler called when the value changes</p>\n',
    'type': '[payload: number]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'modelValue',
    'description': '<p>Current step</p>\n',
    'type': 'number | undefined'
  },
  {
    'name': 'totalSteps',
    'description': '<p>Total number of steps</p>\n',
    'type': 'number'
  },
  {
    'name': 'isNextDisabled',
    'description': '<p>Whether or not the next step is disabled</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'isPrevDisabled',
    'description': '<p>Whether or not the previous step is disabled</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'isFirstStep',
    'description': '<p>Whether or not the first step is active</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'isLastStep',
    'description': '<p>Whether or not the last step is active</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'goToStep',
    'description': '<p>Go to a specific step</p>\n',
    'type': '(step: number): void'
  },
  {
    'name': 'nextStep',
    'description': '<p>Go to the next step</p>\n',
    'type': '(): void'
  },
  {
    'name': 'prevStep',
    'description': '<p>Go to the previous step</p>\n',
    'type': '(): void'
  },
  {
    'name': 'hasNext',
    'description': '<p>Whether or not there is a next step</p>\n',
    'type': '(): boolean'
  },
  {
    'name': 'hasPrev',
    'description': '<p>Whether or not there is a previous step</p>\n',
    'type': '(): boolean'
  }
]" />

<MethodsTable :data="[
  {
    'name': 'goToStep',
    'description': '',
    'type': '(step: number) => void'
  },
  {
    'name': 'nextStep',
    'description': '',
    'type': '() => void'
  },
  {
    'name': 'prevStep',
    'description': '',
    'type': '() => void'
  },
  {
    'name': 'hasNext',
    'description': '',
    'type': '() => boolean'
  },
  {
    'name': 'hasPrev',
    'description': '',
    'type': '() => boolean'
  }
]" />
