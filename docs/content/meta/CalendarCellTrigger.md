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
    'name': 'day',
    'description': '<p>The date value provided to the cell trigger</p>\n',
    'type': 'DateValue',
    'required': true
  },
  {
    'name': 'month',
    'description': '<p>The month in which the cell is rendered</p>\n',
    'type': 'DateValue',
    'required': true
  }
]" />

<SlotsTable :data="[
  {
    'name': 'dayValue',
    'description': '<p>Current day</p>\n',
    'type': 'string'
  },
  {
    'name': 'disabled',
    'description': '<p>Current disable state</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'selected',
    'description': '<p>Current selected state</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'today',
    'description': '<p>Current today state</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'outsideView',
    'description': '<p>Current outside view state</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'outsideVisibleView',
    'description': '<p>Current outside visible view state</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'unavailable',
    'description': '<p>Current unavailable state</p>\n',
    'type': 'boolean'
  }
]" />
