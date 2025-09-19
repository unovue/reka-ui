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
    'description': '<p>Disable drag handle</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'hitAreaMargins',
    'description': '<p>Allow this much margin when determining resizable handle hit detection</p>\n',
    'type': 'PointerHitAreaMargins',
    'required': false
  },
  {
    'name': 'id',
    'description': '<p>Resize handle id (unique within group); falls back to <code>useId</code> when not provided</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'nonce',
    'description': '<p>Will add <code>nonce</code> attribute to the style tag which can be used by Content Security Policy. &lt;br&gt; If omitted, inherits globally from <code>ConfigProvider</code>.</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'tabindex',
    'description': '<p>Tabindex for the handle</p>\n',
    'type': 'number',
    'required': false,
    'default': '0'
  }
]" />

<EmitsTable :data="[
  {
    'name': 'dragging',
    'description': '<p>Event handler called when dragging the handler.</p>\n',
    'type': '[isDragging: boolean]'
  }
]" />
