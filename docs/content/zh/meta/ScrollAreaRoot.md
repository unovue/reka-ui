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
    'name': 'dir',
    'description': '<p>列表框的读取方向（如果适用）。<br/>如果省略，则从 <code>ConfigProvider</code>全局继承或采用 LTR（从左到右）读取模式。</p>\n',
    'type': '\'ltr\' | \'rtl\'',
    'required': false
  },
  {
    'name': 'scrollHideDelay',
    'description': '<p>如果type设置为<code>scroll</code>或<code>hover</code>，则此prop确定用户停止与滚动条交互后隐藏滚动条之前的时间长度（以毫秒为单位）。</p>\n',
    'type': 'number',
    'required': false,
    'default': '600'
  },
  {
    'name': 'type',
    'description': '<p>描述滚动条可见性的性质，类似于MacOS中的滚动条首选项如何控制本机滚动条的可见性。</p>\n<p><code>auto</code>-表示当内容在相应方向上溢出时滚动条是可见的。<br>\n<code>always</code>-表示滚动条始终可见，无论内容是否溢出。<br>\n<code>scroll</code>-表示当用户沿着其相应方向滚动时滚动条是可见的。<br>\n<code>hover</code>-当用户沿着其相应方向滚动并且当用户悬停在滚动区域上时。</p>\n',
    'type': '\'scroll\' | \'always\' | \'auto\' | \'hover\'',
    'required': false,
    'default': '\'hover\''
  }
]" />

<MethodsTable :data="[
  {
    'name': 'scrollTop',
    'description': '<p>将视口滚动到顶部</p>\n',
    'type': '() => void'
  },
  {
    'name': 'scrollTopLeft',
    'description': '<p>滚动视口到左上角</p>\n',
    'type': '() => void'
  }
]" />
