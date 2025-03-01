<PropsTable :data="[
  {
    'name': 'altText',
    'description': '<p>执行操作的替代方法的简短描述。为无法轻松/快速导航到按钮的屏幕阅读器用户设计。</p>\n',
    'type': 'string',
    'required': true
  },
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
  }
]" />
