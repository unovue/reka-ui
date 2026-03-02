<!-- This file was automatically generated. Do not edit it manually -->

<PropsTable :data="[
  {
    'name': 'as',
    'description': '<p>The element or component this component should render as. Can be overwritten by <code>asChild</code>.</p>\n',
    'type': 'AsTag | Component',
    'required': false,
    'default': '\'span\''
  },
  {
    'name': 'asChild',
    'description': '<p>Change the default rendered element for the one passed as a child, merging their props and behavior.</p>\n<p>Read our <a href=\'https://www.reka-ui.com/docs/guides/composition\'>Composition</a> guide for more details.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'channel',
    'description': '<p>The color channel that this slider manipulates.</p>\n',
    'type': '\'red\' | \'green\' | \'blue\' | \'alpha\' | \'hue\' | \'saturation\' | \'lightness\' | \'brightness\'',
    'required': true
  },
  {
    'name': 'colorSpace',
    'description': '<p>The color space to operate in.</p>\n',
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
    'name': 'dir',
    'description': '<p>The reading direction of the slider.</p>\n',
    'type': '\'ltr\' | \'rtl\'',
    'required': false
  },
  {
    'name': 'disabled',
    'description': '<p>When <code>true</code>, prevents the user from interacting with the slider.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'inverted',
    'description': '<p>Whether the slider is visually inverted.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'modelValue',
    'description': '<p>The color value (controlled). Can be a hex string or Color object.</p>\n',
    'type': 'string | Color',
    'required': false
  },
  {
    'name': 'name',
    'description': '<p>The name of the input element for form submission.</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'orientation',
    'description': '<p>The orientation of the slider.</p>\n',
    'type': '\'horizontal\' | \'vertical\'',
    'required': false,
    'default': '\'horizontal\''
  },
  {
    'name': 'required',
    'description': '<p>When <code>true</code>, indicates that the field must be filled before the form can be submitted.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'step',
    'description': '<p>Custom step value for increment/decrement. Defaults to the channel\'s natural step.</p>\n',
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
