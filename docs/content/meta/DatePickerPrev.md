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
    'name': 'prevPage',
    'description': '<p>The function to be used for the prev page. Overwrites the <code>prevPage</code> function set on the <code>CalendarRoot</code>.</p>\n',
    'type': '((placeholder: DateValue) => DateValue)',
    'required': false
  }
]" />

<SlotsTable :data="[
  {
    'name': 'disabled',
    'description': '<p>Current disable state</p>\n',
    'type': 'boolean'
  }
]" />
