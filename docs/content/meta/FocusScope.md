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
    'name': 'loop',
    'description': '<p>When <code>true</code>, tabbing from last item will focus first tabbable\nand shift+tab from first item will focus last tababble.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'trapped',
    'description': '<p>When <code>true</code>, focus cannot escape the focus scope via keyboard,\npointer, or a programmatic focus.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  }
]" />

<EmitsTable :data="[
  {
    'name': 'mountAutoFocus',
    'description': '<p>Event handler called when auto-focusing on mount.\nCan be prevented.</p>\n',
    'type': '[event: Event]'
  },
  {
    'name': 'unmountAutoFocus',
    'description': '<p>Event handler called when auto-focusing on unmount.\nCan be prevented.</p>\n',
    'type': '[event: Event]'
  }
]" />
