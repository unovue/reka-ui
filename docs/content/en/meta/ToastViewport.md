<!-- This file was automatic generated. Do not edit it manually -->

<PropsTable :data="[
  {
    'name': 'as',
    'description': '<p>The element or component this component should render as. Can be overwritten by <code>asChild</code>.</p>\n',
    'type': 'AsTag | Component',
    'required': false,
    'default': '\'ol\''
  },
  {
    'name': 'asChild',
    'description': '<p>Change the default rendered element for the one passed as a child, merging their props and behavior.</p>\n<p>Read our <a href=\'https://www.reka-ui.com/docs/guides/composition\'>Composition</a> guide for more details.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'hotkey',
    'description': '<p>The keys to use as the keyboard shortcut that will move focus to the toast viewport.</p>\n',
    'type': 'string[]',
    'required': false,
    'default': '[\'F8\']'
  },
  {
    'name': 'label',
    'description': '<p>An author-localized label for the toast viewport to provide context for screen reader users\nwhen navigating page landmarks. The available <code>{hotkey}</code> placeholder will be replaced for you.\nAlternatively, you can pass in a custom function to generate the label.</p>\n',
    'type': 'string | ((hotkey: string) => string)',
    'required': false,
    'default': '\'Notifications ({hotkey})\''
  }
]" />
