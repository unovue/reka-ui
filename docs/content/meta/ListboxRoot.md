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
    'name': 'by',
    'description': '<p>Use this to compare objects by a particular field, or pass your own comparison function for complete control over how objects are compared.</p>\n',
    'type': 'string | ((a: AcceptableValue, b: AcceptableValue) => boolean)',
    'required': false
  },
  {
    'name': 'defaultValue',
    'description': '<p>The value of the listbox when initially rendered. Use when you do not need to control the state of the Listbox</p>\n',
    'type': 'AcceptableValue | AcceptableValue[]',
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
    'description': '<p>When <code>true</code>, prevents the user from interacting with listbox</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'highlightOnHover',
    'description': '<p>When <code>true</code>, hover over item will trigger highlight</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'modelValue',
    'description': '<p>The controlled value of the listbox. Can be binded with with <code>v-model</code>.</p>\n',
    'type': 'AcceptableValue | AcceptableValue[]',
    'required': false
  },
  {
    'name': 'multiple',
    'description': '<p>Whether multiple options can be selected or not.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'name',
    'description': '<p>The name of the field. Submitted with its owning form as part of a name/value pair.</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'orientation',
    'description': '<p>The orientation of the listbox. &lt;br&gt;Mainly so arrow navigation is done accordingly (left &amp; right vs. up &amp; down)</p>\n',
    'type': '\'vertical\' | \'horizontal\'',
    'required': false,
    'default': '\'vertical\''
  },
  {
    'name': 'required',
    'description': '<p>When <code>true</code>, indicates that the user must set the value before the owning form can be submitted.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'selectionBehavior',
    'description': '<p>How multiple selection should behave in the collection.</p>\n',
    'type': '\'replace\' | \'toggle\'',
    'required': false,
    'default': '\'toggle\''
  }
]" />

<EmitsTable :data="[
  {
    'name': 'entryFocus',
    'description': '<p>Event handler called when container is being focused. Can be prevented.</p>\n',
    'type': '[event: CustomEvent<any>]'
  },
  {
    'name': 'highlight',
    'description': '<p>Event handler when highlighted element changes.</p>\n',
    'type': '[payload: { ref: HTMLElement; value: AcceptableValue; }]'
  },
  {
    'name': 'leave',
    'description': '<p>Event handler called when the mouse leave the container</p>\n',
    'type': '[event: Event]'
  },
  {
    'name': 'update:modelValue',
    'description': '<p>Event handler called when the value changes.</p>\n',
    'type': '[value: AcceptableValue]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'modelValue',
    'description': '<p>Current active value</p>\n',
    'type': 'AcceptableValue | AcceptableValue[] | undefined'
  }
]" />
