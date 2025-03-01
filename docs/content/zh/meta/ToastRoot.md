<PropsTable :data="[
  {
    'name': 'as',
    'description': '<p>当前元素应渲染为的元素或组件。可以被 <code>asChild</code> 覆盖</p>\n',
    'type': 'AsTag | Component',
    'required': false,
    'default': '\'li\''
  },
  {
    'name': 'asChild',
    'description': '<p>将默认渲染的元素更改为作为子元素传递的元素，合并它们的 props 和行为。</p>\n<p>阅读我们的<a href=\'../guides/composition\'>合成</a>指南了解更多详情。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'defaultOpen',
    'description': '<p>对话框最初呈现时的打开状态。在不需要控制其打开状态时使用。</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'true'
  },
  {
    'name': 'duration',
    'description': '<p>Toast 应保持可见的时间（以毫秒为单位）。覆盖<code>ToastProvider</code>的值。</p>\n',
    'type': 'number',
    'required': false
  },
  {
    'name': 'forceMount',
    'description': '<p>用于在需要更多控制时强制挂载。\n使用Vue动画库控制动画时很有用。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'open',
    'description': '<p>受控打开状态。可以绑定为<code>v-model:open</code>。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'type',
    'description': '<p>控制 Toast 的敏感性以实现可访问性。</p>\n<p>对于作为用户操作结果的Toast，选择<code>foreground</code>。从后台任务生成的 Toast 应使用<code>background</code>。</p>\n',
    'type': '\'foreground\' | \'background\'',
    'required': false,
    'default': '\'foreground\''
  }
]" />

<EmitsTable :data="[
  {
    'name': 'escapeKeyDown',
    'description': '<p>Escape 键按下时调用的事件处理程序。可以通过调用<code>event.prventDefault</code>来阻止它。</p>\n',
    'type': '[event: KeyboardEvent]'
  },
  {
    'name': 'pause',
    'description': '<p>当关闭计时器暂停时调用事件处理程序。当指针在视口上移动、视口聚焦或窗口失焦时，就会触发。</p>\n',
    'type': '[]'
  },
  {
    'name': 'resume',
    'description': '<p>当关闭计时器恢复时调用事件处理程序。当指针从视口移开、视口模糊或窗口聚焦时，就会触发。</p>\n',
    'type': '[]'
  },
  {
    'name': 'swipeCancel',
    'description': '',
    'type': '[event: SwipeEvent]'
  },
  {
    'name': 'swipeEnd',
    'description': '<p>在滑动交互结束时调用的事件处理程序。可以通过调用<code>event.prevntDefault</code>来阻止。</p>\n',
    'type': '[event: SwipeEvent]'
  },
  {
    'name': 'swipeMove',
    'description': '<p>在滑动交互期间调用的事件处理程序。</p>\n',
    'type': '[event: SwipeEvent]'
  },
  {
    'name': 'swipeStart',
    'description': '<p>在滑动交互开始时调用的事件处理程序。 可以通过调用<code>event.preventDefault</code>来阻止。</p>\n',
    'type': '[event: SwipeEvent]'
  },
  {
    'name': 'update:open',
    'description': '<p>打开状态更改时调用的事件处理程序</p>\n',
    'type': '[value: boolean]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'open',
    'description': '<p>当前打开状态</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'remaining',
    'description': '<p>Remaining time (in ms)</p>\n',
    'type': 'number'
  },
  {
    'name': 'duration',
    'description': '<p>Total time the toast will remain visible for (in ms)</p>\n',
    'type': 'number'
  }
]" />
