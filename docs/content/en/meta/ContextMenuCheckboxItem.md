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
    'name': 'disabled',
    'description': '<p>When <code>true</code>, prevents the user from interacting with the item.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'modelValue',
    'description': '<p>The controlled checked state of the item. Can be used as <code>v-model</code>.</p>\n',
    'type': 'false | true | \'indeterminate\'',
    'required': false
  },
  {
    'name': 'textValue',
    'description': '<p>Optional text used for typeahead purposes. By default the typeahead behavior will use the <code>.textContent</code> of the item. &lt;br&gt;\nUse this when the content is complex, or you have non-textual content inside.</p>\n',
    'type': 'string',
    'required': false
  }
]" />

<EmitsTable :data="[
  {
    'name': 'select',
    'description': '<p>Event handler called when the user selects an item (via mouse or keyboard). &lt;br&gt;\nCalling <code>event.preventDefault</code> in this handler will prevent the menu from closing when selecting that item.</p>\n',
    'type': '[event: Event]'
  },
  {
    'name': 'update:modelValue',
    'description': '<p>Event handler called when the value changes.</p>\n',
    'type': '[payload: boolean]'
  }
]" />
