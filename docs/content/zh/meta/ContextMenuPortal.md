<PropsTable :data="[
  {
    'name': 'defer',
    'description': '<p>将 Teleport 目标的解析推迟到应用程序的其他部分挂载完毕（需要 Vue 3.5.0+）</p>\n<p><a href=\'https://cn.vuejs.org/guide/built-ins/teleport.html#deferred-teleport\' target=\'_blank\'>参考</a></p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'disabled',
    'description': '<p>禁用 teleport 并内联渲染组件</p>\n<p><a href=\'https://cn.vuejs.org/guide/built-ins/teleport.html#disabling-teleport\' target=\'_blank\'>参考</a></p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'forceMount',
    'description': '<p>用于在需要更多控制时强制挂载。\n使用Vue动画库控制动画时很有用。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'to',
    'description': '<p>Vue 原生 teleport 组件 prop <code>:to</code></p>\n<p><a href=\'https://cn.vuejs.org/guide/built-ins/teleport.html#basic-usage\' target=\'_blank\'>参考</a></p>\n',
    'type': 'string | HTMLElement',
    'required': false
  }
]" />
