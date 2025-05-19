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
    'name': 'dir',
    'description': '<p>The reading direction of the combobox when applicable. &lt;br&gt; If omitted, inherits globally from <code>ConfigProvider</code> or assumes LTR (left-to-right) reading mode.</p>\n',
    'type': '\'ltr\' | \'rtl\'',
    'required': false
  },
  {
    'name': 'scrollHideDelay',
    'description': '<p>If type is set to either <code>scroll</code> or <code>hover</code>, this prop determines the length of time, in milliseconds, &lt;br&gt; before the scrollbars are hidden after the user stops interacting with scrollbars.</p>\n',
    'type': 'number',
    'required': false,
    'default': '600'
  },
  {
    'name': 'type',
    'description': '<p>Describes the nature of scrollbar visibility, similar to how the scrollbar preferences in MacOS control visibility of native scrollbars.</p>\n<p><code>auto</code> - means that scrollbars are visible when content is overflowing on the corresponding orientation. &lt;br&gt;\n<code>always</code> - means that scrollbars are always visible regardless of whether the content is overflowing.&lt;br&gt;\n<code>scroll</code> - means that scrollbars are visible when the user is scrolling along its corresponding orientation.&lt;br&gt;\n<code>hover</code> - when the user is scrolling along its corresponding orientation and when the user is hovering over the scroll area.</p>\n',
    'type': '\'scroll\' | \'always\' | \'hover\' | \'auto\'',
    'required': false,
    'default': '\'hover\''
  }
]" />

<MethodsTable :data="[
  {
    'name': 'scrollTop',
    'description': '<p>Scroll viewport to top</p>\n',
    'type': '() => void'
  },
  {
    'name': 'scrollTopLeft',
    'description': '<p>Scroll viewport to top-left</p>\n',
    'type': '() => void'
  }
]" />
