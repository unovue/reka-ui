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
    'name': 'currentTabStopId',
    'description': '<p>The controlled value of the current stop item. Can be binded as <code>v-model</code>.</p>\n',
    'type': 'string | null',
    'required': false
  },
  {
    'name': 'defaultCurrentTabStopId',
    'description': '<p>The value of the current stop item.</p>\n<p>Use when you do not need to control the state of the stop item.</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'dir',
    'description': '<p>The direction of navigation between items.</p>\n',
    'type': '\'ltr\' | \'rtl\'',
    'required': false
  },
  {
    'name': 'loop',
    'description': '<p>Whether keyboard navigation should loop around</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'orientation',
    'description': '<p>The orientation of the group.\nMainly so arrow navigation is done accordingly (left &amp; right vs. up &amp; down)</p>\n',
    'type': '\'vertical\' | \'horizontal\'',
    'required': false
  },
  {
    'name': 'preventScrollOnEntryFocus',
    'description': '<p>When <code>true</code>, will prevent scrolling to the focus item when focused.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  }
]" />

<EmitsTable :data="[
  {
    'name': 'entryFocus',
    'description': '<p>Event handler called when container is being focused. Can be prevented.</p>\n',
    'type': '[event: Event]'
  },
  {
    'name': 'update:currentTabStopId',
    'description': '',
    'type': '[value: string | null]'
  }
]" />

<MethodsTable :data="[
  {
    'name': 'getItems',
    'description': '',
    'type': '(includeDisabledItem?: boolean) => { ref: HTMLElement; value?: any; }[]'
  }
]" />
