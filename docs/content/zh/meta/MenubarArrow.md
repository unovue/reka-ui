<PropsTable :data="[
  {
    'name': 'as',
    'description': '<p>当前元素应渲染为的元素或组件。可以被 <code>asChild</code> 覆盖</p>\n',
    'type': 'AsTag | Component',
    'required': false,
    'default': '\'svg\''
  },
  {
    'name': 'asChild',
    'description': '<p>将默认渲染的元素更改为作为子元素传递的元素，合并它们的 props 和行为。</p>\n<p>阅读我们的<a href=\'../guides/composition\'>合成</a>指南了解更多详情。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'height',
    'description': '<p>箭头的高度（以像素为单位）。</p>\n',
    'type': 'number',
    'required': false,
    'default': '5'
  },
  {
    'name': 'rounded',
    'description': '<p>当<code>true</code>时，则渲染 arrow 的圆角版本。不要使用<code>as</code>/<code>asChild</code></p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'width',
    'description': '<p>箭头的宽度（以像素为单位）。</p>\n',
    'type': 'number',
    'required': false,
    'default': '10'
  }
]" />
