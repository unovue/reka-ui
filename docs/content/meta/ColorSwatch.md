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
    'name': 'color',
    'description': '<p>The color to display in the swatch as a hex string or Color object.\nExample: <code>#16a372</code>, <code>#ff5733</code>, or <code>{ space: \'hsl\', h: 120, s: 100, l: 50, alpha: 1 }</code>.</p>\n',
    'type': 'string | Color',
    'required': false,
    'default': '\'\''
  },
  {
    'name': 'label',
    'description': '<p>Optional accessible label for the color. If omitted, the color name will be derived from the color value.</p>\n',
    'type': 'string',
    'required': false
  }
]" />

<SlotsTable :data="[
  {
    'name': 'color',
    'description': '',
    'type': 'string'
  },
  {
    'name': 'alpha',
    'description': '',
    'type': 'number'
  }
]" />
