<PropsTable :data="[
  {
    'name': 'dir',
    'description': '<p>应用程序的全局读取方向。这将被所有 primitives 继承。</p>\n',
    'type': '\'ltr\' | \'rtl\'',
    'required': false,
    'default': '\'ltr\''
  },
  {
    'name': 'locale',
    'description': '<p>应用程序的全局区域设置。这将被所有 primitives 继承。</p>\n',
    'type': 'string',
    'required': false,
    'default': '\'en\''
  },
  {
    'name': 'nonce',
    'description': '<p>应用程序的全局 <code>nonce</code> 值。这将由相关的 primitives 继承。</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'scrollBody',
    'description': '<p>应用程序的全局滚动体行为。这将由相关的 primitives 继承。</p>\n',
    'type': 'boolean | ScrollBodyOption',
    'required': false,
    'default': 'true'
  },
  {
    'name': 'useId',
    'description': '<p>全局 <code>useId</code> 注入作为防止水合问题的解决方法。</p>\n',
    'type': '(() => string)',
    'required': false
  }
]" />

<MethodsTable :data="[
  {
    'name': 'useId',
    'description': '<p>全局 <code>useId</code> 注入作为防止水合问题的解决方法。</p>\n',
    'type': '() => string'
  }
]" />
