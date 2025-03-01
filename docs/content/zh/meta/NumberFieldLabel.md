<PropsTable :data="[
  {
    'name': 'as',
    'description': '<p>此组件应呈现为的元素或组件。可以被<Code>asChild</Code>覆盖</p>\n',
    'type': 'AsTag | Component',
    'required': false,
    'default': '\'label\''
  },
  {
    'name': 'asChild',
    'description': '<p>将默认渲染的元素更改为作为子元素传递的元素，合并它们的 props 和行为。</p>\n<p>Read our <a href=\'https://reka-ui.com/guides/composition.html\'>Composition</a> guide for more details.</p>\n',
    'type': 'boolean',
    'required': false
  }
]" />
