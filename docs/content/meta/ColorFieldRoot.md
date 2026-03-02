<!-- This file was automatically generated. Do not edit it manually -->

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
    'name': 'channel',
    'description': '<p>The color channel to display. If not provided, displays hex value.</p>\n',
    'type': '\'red\' | \'green\' | \'blue\' | \'alpha\' | \'hue\' | \'saturation\' | \'lightness\' | \'brightness\'',
    'required': false
  },
  {
    'name': 'colorSpace',
    'description': '<p>The color space to operate in when displaying a channel.</p>\n',
    'type': '\'rgb\' | \'hsl\' | \'hsb\'',
    'required': false,
    'default': '\'hsl\''
  },
  {
    'name': 'defaultValue',
    'description': '<p>The default color value (uncontrolled).</p>\n',
    'type': 'string | Color',
    'required': false,
    'default': '\'#000000\''
  },
  {
    'name': 'disabled',
    'description': '<p>When <code>true</code>, prevents the user from interacting with the field.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'disableWheelChange',
    'description': '<p>When <code>true</code>, prevents the value from changing on wheel scroll.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'locale',
    'description': '<p>The locale to use for number formatting.</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'modelValue',
    'description': '<p>The color value (controlled). Can be a hex string or Color object.</p>\n',
    'type': 'string | Color',
    'required': false
  },
  {
    'name': 'placeholder',
    'description': '<p>Placeholder text when the field is empty.</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'readonly',
    'description': '<p>When <code>true</code>, the field is read-only.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'required',
    'description': '<p>When <code>true</code>, indicates that the field must be filled before the form can be submitted.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'step',
    'description': '<p>Custom step value for increment/decrement. Defaults to channel step or 1 for hex.</p>\n',
    'type': 'number',
    'required': false
  }
]" />

<EmitsTable :data="[
  {
    'name': 'update:color',
    'description': '',
    'type': '[value: Color]'
  },
  {
    'name': 'update:modelValue',
    'description': '',
    'type': '[value: string]'
  }
]" />
