<!-- This file was automatic generated. Do not edit it manually -->

<PropsTable :data="[
  {
    'name': 'as',
    'description': '<p>The element or component this component should render as. Can be overwritten by <code>asChild</code>.</p>\n',
    'type': 'AsTag | Component',
    'required': false,
    'default': '\'li\''
  },
  {
    'name': 'asChild',
    'description': '<p>Change the default rendered element for the one passed as a child, merging their props and behavior.</p>\n<p>Read our <a href=\'https://www.reka-ui.com/docs/guides/composition\'>Composition</a> guide for more details.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'level',
    'description': '<p>Level of depth</p>\n',
    'type': 'number',
    'required': true
  },
  {
    'name': 'value',
    'description': '<p>Value given to this item</p>\n',
    'type': 'Record<string, any>',
    'required': true
  }
]" />

<EmitsTable :data="[
  {
    'name': 'select',
    'description': '<p>Event handler called when the selecting item. &lt;br&gt; It can be prevented by calling <code>event.preventDefault</code>.</p>\n',
    'type': '[event: SelectEvent<Record<string, any>>]'
  },
  {
    'name': 'toggle',
    'description': '<p>Event handler called when the selecting item. &lt;br&gt; It can be prevented by calling <code>event.preventDefault</code>.</p>\n',
    'type': '[event: ToggleEvent<Record<string, any>>]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'isExpanded',
    'description': '',
    'type': 'boolean'
  },
  {
    'name': 'isSelected',
    'description': '',
    'type': 'boolean'
  },
  {
    'name': 'isIndeterminate',
    'description': '',
    'type': 'boolean | undefined'
  },
  {
    'name': 'handleToggle',
    'description': '',
    'type': '(): void'
  },
  {
    'name': 'handleSelect',
    'description': '',
    'type': '(): void'
  }
]" />
