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
    'name': 'defaultValue',
    'description': '<p>切换开关初始渲染时的按下状态。当您不需要控制其打开状态时使用。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'disabled',
    'description': '<p>当<code>true</code>时，阻止用户与切换交互。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'modelValue',
    'description': '<p>切换开关的受控按下状态。可以绑定为<code>v-model</code>。</p>\n',
    'type': 'boolean | null',
    'required': false
  },
  {
    'name': 'value',
    'description': '<p>切换组项的字符串值。切换组中的所有项目都应使用唯一值。</p>\n',
    'type': 'AcceptableValue',
    'required': true
  }
]" />
