<!-- This file was automatic generated. Do not edit it manually -->

<PropsTable :data="[
  {
    'name': 'as',
    'description': '<p>The element or component this component should render as. Can be overwritten by <code>asChild</code>.</p>\n',
    'type': 'AsTag | Component',
    'required': false,
    'default': '\'ul\''
  },
  {
    'name': 'asChild',
    'description': '<p>Change the default rendered element for the one passed as a child, merging their props and behavior.</p>\n<p>Read our <a href=\'https://www.reka-ui.com/docs/guides/composition\'>Composition</a> guide for more details.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'defaultExpanded',
    'description': '<p>The value of the expanded tree when initially rendered. Use when you do not need to control the state of the expanded tree</p>\n',
    'type': 'string[]',
    'required': false
  },
  {
    'name': 'defaultValue',
    'description': '<p>The value of the tree when initially rendered. Use when you do not need to control the state of the tree</p>\n',
    'type': 'Record<string, any> | Record<string, any>[]',
    'required': false
  },
  {
    'name': 'dir',
    'description': '<p>The reading direction of the listbox when applicable. &lt;br&gt; If omitted, inherits globally from <code>ConfigProvider</code> or assumes LTR (left-to-right) reading mode.</p>\n',
    'type': '\'ltr\' | \'rtl\'',
    'required': false
  },
  {
    'name': 'disabled',
    'description': '<p>When <code>true</code>, prevents the user from interacting with tree</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'expanded',
    'description': '<p>The controlled value of the expanded item. Can be binded with with <code>v-model</code>.</p>\n',
    'type': 'string[]',
    'required': false
  },
  {
    'name': 'getChildren',
    'description': '<p>This function is passed the index of each item and should return a list of children for that item</p>\n',
    'type': '((val: Record<string, any>) => Record<string, any>[])',
    'required': false,
    'default': 'val.children'
  },
  {
    'name': 'getKey',
    'description': '<p>This function is passed the index of each item and should return a unique key for that item</p>\n',
    'type': '(val: Record<string, any>): string',
    'required': true
  },
  {
    'name': 'items',
    'description': '<p>List of items</p>\n',
    'type': 'Record<string, any>[]',
    'required': false
  },
  {
    'name': 'modelValue',
    'description': '<p>The controlled value of the tree. Can be binded with with <code>v-model</code>.</p>\n',
    'type': 'Record<string, any> | Record<string, any>[]',
    'required': false
  },
  {
    'name': 'multiple',
    'description': '<p>Whether multiple options can be selected or not.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'propagateSelect',
    'description': '<p>When <code>true</code>, selecting parent will select the descendants.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'selectionBehavior',
    'description': '<p>How multiple selection should behave in the collection.</p>\n',
    'type': '\'toggle\' | \'replace\'',
    'required': false,
    'default': '\'toggle\''
  }
]" />

<EmitsTable :data="[
  {
    'name': 'update:expanded',
    'description': '',
    'type': '[val: string[]]'
  },
  {
    'name': 'update:modelValue',
    'description': '<p>Event handler called when the value of the toggle changes.</p>\n',
    'type': '[val: Record<string, any>]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'flattenItems',
    'description': '',
    'type': 'FlattenedItem<Record<string, any>>[]'
  },
  {
    'name': 'modelValue',
    'description': '',
    'type': 'Record<string, any> | Record<string, any>[]'
  },
  {
    'name': 'expanded',
    'description': '',
    'type': 'string[]'
  }
]" />
