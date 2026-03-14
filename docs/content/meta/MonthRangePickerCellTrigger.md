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
    'name': 'month',
    'description': '<p>The date value provided to the cell trigger</p>\n',
    'type': 'DateValue',
    'required': true
  }
]" />

<SlotsTable :data="[
  {
    'name': 'monthValue',
    'description': '<p>Current month value (short name)</p>\n',
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
    'description': '<p>Current month is today\'s month state</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'unavailable',
    'description': '<p>Current unavailable state</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'highlighted',
    'description': '<p>Current highlighted state</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'highlightedStart',
    'description': '<p>Current highlighted start state</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'highlightedEnd',
    'description': '<p>Current highlighted end state</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'selectionStart',
    'description': '<p>Current selection start state</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'selectionEnd',
    'description': '<p>Current selection end state</p>\n',
    'type': 'boolean'
  }
]" />
