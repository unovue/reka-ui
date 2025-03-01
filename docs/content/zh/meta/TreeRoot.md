<PropsTable :data="[
  {
    'name': 'as',
    'description': '<p>当前元素应渲染为的元素或组件。可以被 <code>asChild</code> 覆盖</p>\n',
    'type': 'AsTag | Component',
    'required': false,
    'default': '\'ul\''
  },
  {
    'name': 'asChild',
    'description': '<p>将默认渲染的元素更改为作为子元素传递的元素，合并它们的 props 和行为。</p>\n<p>阅读我们的<a href=\'../guides/composition\'>合成</a>指南了解更多详情。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'defaultExpanded',
    'description': '<p>初始渲染时展开树的值。不需要控制展开树的状态时使用</p>\n',
    'type': 'string[]',
    'required': false
  },
  {
    'name': 'defaultValue',
    'description': '<p>最初渲染时树的值。不需要控制树的状态时使用</p>\n',
    'type': 'Record<string, any> | Record<string, any>[]',
    'required': false
  },
  {
    'name': 'dir',
    'description': '<p>列表框的读取方向（如果适用）。<br/>如果省略，则从 <code>ConfigProvider</code>全局继承或采用 LTR（从左到右）读取模式。</p>\n',
    'type': '\'ltr\' | \'rtl\'',
    'required': false
  },
  {
    'name': 'disabled',
    'description': '<p>当<code>true</code>时，阻止用户与树交互</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'expanded',
    'description': '<p>展开项的受控值。可以与<code>v-model</code>绑定。</p>\n',
    'type': 'string[]',
    'required': false
  },
  {
    'name': 'getChildren',
    'description': '<p>此函数传递每个项的索引，并应返回该项的子列表</p>\n',
    'type': '((val: Record<string, any>) => Record<string, any>[])',
    'required': false,
    'default': 'val.children'
  },
  {
    'name': 'getKey',
    'description': '<p>此函数传递每个项的索引，并应返回该项的唯一键</p>\n',
    'type': '(val: Record<string, any>) => string',
    'required': true
  },
  {
    'name': 'items',
    'description': '<p>项列表</p>\n',
    'type': 'Record<string, any>[]',
    'required': false
  },
  {
    'name': 'modelValue',
    'description': '<p>树的受控值。可以与<code>v-model</code>绑定。</p>\n',
    'type': 'Record<string, any> | Record<string, any>[]',
    'required': false
  },
  {
    'name': 'multiple',
    'description': '<p>是否可以选择多个选项。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'propagateSelect',
    'description': '<p>当<code>true</code>时，选择父级将选择后代。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'selectionBehavior',
    'description': '<p>多个选择在集合中的行为方式。</p>\n',
    'type': '\'toggle\' | \'replace\'',
    'required': false,
    'default': '\'toggle\''
  }
]" />

<EmitsTable :data="[
  {
    'name': 'update:expanded',
    'description': '',
    'type': '[val: string[]]'
  },
  {
    'name': 'update:modelValue',
    'description': '<p>切换开关值更改时调用的事件处理程序。</p>\n',
    'type': '[val: Record<string, any>]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'flattenItems',
    'description': '',
    'type': 'FlattenedItem<Record<string, any>>[]'
  },
  {
    'name': 'modelValue',
    'description': '',
    'type': 'Record<string, any> | Record<string, any>[]'
  },
  {
    'name': 'expanded',
    'description': '',
    'type': 'string[]'
  }
]" />
