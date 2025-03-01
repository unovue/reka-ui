<PropsTable :data="[
  {
    'name': 'as',
    'description': '<p>当前元素应渲染为的元素或组件。可以被 <code>asChild</code> 覆盖</p>\n',
    'type': 'AsTag | Component',
    'required': false,
    'default': '\'div\''
  },
  {
    'name': 'asChild',
    'description': '<p>将默认渲染的元素更改为作为子元素传递的元素，合并它们的 props 和行为。</p>\n<p>阅读我们的<a href=\'../guides/composition\'>合成</a>指南了解更多详情。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'decorative',
    'description': '<p>组件是否纯粹是装饰性的。<br>当<code>true</code>时，accessibility-related属性被更新，以便从可访问性树中删除渲染的元素。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'orientation',
    'description': '<p>组件的方向。</p>\n<p><code>vertical</code>或<code>horizontal</code>。默认为<code>horizontal</code>。</p>\n',
    'type': '\'vertical\' | \'horizontal\'',
    'required': false,
    'default': '\'horizontal\''
  }
]" />
