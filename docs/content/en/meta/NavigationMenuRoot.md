<!-- This file was automatic generated. Do not edit it manually -->

<PropsTable :data="[
  {
    'name': 'as',
    'description': '<p>The element or component this component should render as. Can be overwritten by <code>asChild</code>.</p>\n',
    'type': 'AsTag | Component',
    'required': false,
    'default': '\'nav\''
  },
  {
    'name': 'asChild',
    'description': '<p>Change the default rendered element for the one passed as a child, merging their props and behavior.</p>\n<p>Read our <a href=\'https://www.reka-ui.com/docs/guides/composition\'>Composition</a> guide for more details.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'defaultValue',
    'description': '<p>The value of the menu item that should be active when initially rendered.</p>\n<p>Use when you do not need to control the value state.</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'delayDuration',
    'description': '<p>The duration from when the pointer enters the trigger until the tooltip gets opened.</p>\n',
    'type': 'number',
    'required': false,
    'default': '200'
  },
  {
    'name': 'dir',
    'description': '<p>The reading direction of the combobox when applicable.</p>\n<p>If omitted, inherits globally from <code>ConfigProvider</code> or assumes LTR (left-to-right) reading mode.</p>\n',
    'type': '\'ltr\' | \'rtl\'',
    'required': false
  },
  {
    'name': 'disableClickTrigger',
    'description': '<p>If <code>true</code>, menu cannot be open by click on trigger</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'disableHoverTrigger',
    'description': '<p>If <code>true</code>, menu cannot be open by hover on trigger</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'disablePointerLeaveClose',
    'description': '<p>If <code>true</code>, menu will not close during pointer leave event</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'modelValue',
    'description': '<p>The controlled value of the menu item to activate. Can be used as <code>v-model</code>.</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'orientation',
    'description': '<p>The orientation of the menu.</p>\n',
    'type': '\'vertical\' | \'horizontal\'',
    'required': false,
    'default': '\'horizontal\''
  },
  {
    'name': 'skipDelayDuration',
    'description': '<p>How much time a user has to enter another trigger without incurring a delay again.</p>\n',
    'type': 'number',
    'required': false,
    'default': '300'
  },
  {
    'name': 'unmountOnHide',
    'description': '<p>When <code>true</code>, the element will be unmounted on closed state.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'true'
  }
]" />

<EmitsTable :data="[
  {
    'name': 'update:modelValue',
    'description': '<p>Event handler called when the value changes.</p>\n',
    'type': '[value: string]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'modelValue',
    'description': '<p>Current input values</p>\n',
    'type': 'string'
  }
]" />
