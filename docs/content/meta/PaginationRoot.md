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
    'name': 'defaultPage',
    'description': '<p>The value of the page that should be active when initially rendered.</p>\n<p>Use when you do not need to control the value state.</p>\n',
    'type': 'number',
    'required': false,
    'default': '1'
  },
  {
    'name': 'disabled',
    'description': '<p>When <code>true</code>, prevents the user from interacting with item</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'itemsPerPage',
    'description': '<p>Number of items per page</p>\n',
    'type': 'number',
    'required': true
  },
  {
    'name': 'page',
    'description': '<p>The controlled value of the current page. Can be binded as <code>v-model:page</code>.</p>\n',
    'type': 'number',
    'required': false
  },
  {
    'name': 'showEdges',
    'description': '<p>When <code>true</code>, always show first page, last page, and ellipsis</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'siblingCount',
    'description': '<p>Number of sibling should be shown around the current page</p>\n',
    'type': 'number',
    'required': false,
    'default': '2'
  },
  {
    'name': 'total',
    'description': '<p>Number of items in your list</p>\n',
    'type': 'number',
    'required': false,
    'default': '0'
  }
]" />

<EmitsTable :data="[
  {
    'name': 'update:page',
    'description': '<p>Event handler called when the page value changes</p>\n',
    'type': '[value: number]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'page',
    'description': '<p>Current page state</p>\n',
    'type': 'number'
  },
  {
    'name': 'pageCount',
    'description': '<p>Number of pages</p>\n',
    'type': 'number'
  }
]" />
