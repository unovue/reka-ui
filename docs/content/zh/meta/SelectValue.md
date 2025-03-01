<PropsTable :data="[
  {
    'name': 'as',
    'description': '<p>当前元素应渲染为的元素或组件。可以被 <code>asChild</code> 覆盖</p>\n',
    'type': 'AsTag | Component',
    'required': false,
    'default': '\'span\''
  },
  {
    'name': 'asChild',
    'description': '<p>将默认渲染的元素更改为作为子元素传递的元素，合并它们的 props 和行为。</p>\n<p>阅读我们的<a href=\'../guides/composition\'>合成</a>指南了解更多详情。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'placeholder',
    'description': '<p>当未设置<code>value</code>或<code>defaultValue</code>时，将在<code>SelectValue</code>中呈现的内容。</p>\n',
    'type': 'string',
    'required': false,
    'default': '\'\''
  }
]" />

<SlotsTable :data="[
  {
    'name': 'selectedLabel',
    'description': '',
    'type': 'string[]'
  },
  {
    'name': 'modelValue',
    'description': '',
    'type': 'AcceptableValue | AcceptableValue[] | undefined'
  }
]" />
