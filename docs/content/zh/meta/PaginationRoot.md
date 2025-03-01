<PropsTable :data="[
  {
    'name': 'as',
    'description': '<p>当前元素应渲染为的元素或组件。可以被 <code>asChild</code> 覆盖</p>\n',
    'type': 'AsTag | Component',
    'required': false,
    'default': '\'nav\''
  },
  {
    'name': 'asChild',
    'description': '<p>将默认渲染的元素更改为作为子元素传递的元素，合并它们的 props 和行为。</p>\n<p>阅读我们的<a href=\'../guides/composition\'>合成</a>指南了解更多详情。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'defaultPage',
    'description': '<p>初始渲染时应处于活动状态的页面的值。</p>\n<p>在不需要控制值状态时使用。</p>\n',
    'type': 'number',
    'required': false,
    'default': '1'
  },
  {
    'name': 'disabled',
    'description': '<p>当<code>true</code>时，阻止用户与item交互</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'itemsPerPage',
    'description': '<p>每页项数量</p>\n',
    'type': 'number',
    'required': true
  },
  {
    'name': 'page',
    'description': '<p>当前页的受控值。可以绑定为<code>v-model:page</code>。</p>\n',
    'type': 'number',
    'required': false
  },
  {
    'name': 'showEdges',
    'description': '<p>当<code>true</code>时，始终显示第一页、最后一页和省略号</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'siblingCount',
    'description': '<p>应在当前页面周围显示兄弟姐妹的数量</p>\n',
    'type': 'number',
    'required': false,
    'default': '2'
  },
  {
    'name': 'total',
    'description': '<p>您列表中的项目数</p>\n',
    'type': 'number',
    'required': false,
    'default': '0'
  }
]" />

<EmitsTable :data="[
  {
    'name': 'update:page',
    'description': '<p>页面值更改时调用的事件处理程序</p>\n',
    'type': '[value: number]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'page',
    'description': '<p>当前页状态</p>\n',
    'type': 'number'
  },
  {
    'name': 'pageCount',
    'description': '<p>页数</p>\n',
    'type': 'number'
  }
]" />
