<PropsTable :data="[
  {
    'name': 'as',
    'description': '<p>当前元素应渲染为的元素或组件。可以被 <code>asChild</code> 覆盖</p>\n',
    'type': 'AsTag | Component',
    'required': false,
    'default': '\'img\''
  },
  {
    'name': 'asChild',
    'description': '<p>将默认渲染的元素更改为作为子元素传递的元素，合并它们的 props 和行为。</p>\n<p>阅读我们的<a href=\'../guides/composition\'>合成</a>指南了解更多详情。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'referrerPolicy',
    'description': '',
    'type': '\'\' | \'no-referrer\' | \'no-referrer-when-downgrade\' | \'origin\' | \'origin-when-cross-origin\' | \'same-origin\' | \'strict-origin\' | \'strict-origin-when-cross-origin\' | \'unsafe-url\'',
    'required': false
  },
  {
    'name': 'src',
    'description': '',
    'type': 'string',
    'required': true
  }
]" />

<EmitsTable :data="[
  {
    'name': 'loadingStatusChange',
    'description': '<p>提供有关图像加载状态信息的回调。&lt;br&gt;\n如果要更精确地控制在图像加载时要渲染的内容，这将非常有用。</p>\n',
    'type': '[value: ImageLoadingStatus]'
  }
]" />
