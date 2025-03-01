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
    'name': 'disableOutsidePointerEvents',
    'description': '<p>如果<code>true</code>，则悬停/聚焦/单击交互将在<code>DismissableLayer</code>外部的元素上被禁用。用户需要单击外部元素两次才能与他们交互：一次关闭 <code>DismissableLayer</code>，另一次触发元素。</p>\n',
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
    'name': 'trapFocus',
    'description': '<p>如果<code>true</code>，则焦点无法通过键盘、指针或程序聚焦离开 <code>Content</code>。</p>\n',
    'type': 'boolean',
    'required': false
  }
]" />

<EmitsTable :data="[
  {
    'name': 'closeAutoFocus',
    'description': '<p>在关闭时自动聚焦时调用事件处理程序。\n可以被阻止。</p>\n',
    'type': '[event: Event]'
  },
  {
    'name': 'escapeKeyDown',
    'description': '<p>当 Esc 键关闭时调用的事件处理程序。\n可以被阻止。</p>\n',
    'type': '[event: KeyboardEvent]'
  },
  {
    'name': 'focusOutside',
    'description': '<p>当焦点移出 <code>DismissableLayer</code> 时调用的事件处理程序。\n可以被阻止。</p>\n',
    'type': '[event: FocusOutsideEvent]'
  },
  {
    'name': 'interactOutside',
    'description': '<p>当交互发生在 <code>DismissableLayer</code>外部时调用的事件处理程序。具体而言，当<code>pointerdown</code>事件发生在外部或焦点移出该事件时。\n可以被阻止。</p>\n',
    'type': '[event: PointerDownOutsideEvent | FocusOutsideEvent]'
  },
  {
    'name': 'openAutoFocus',
    'description': '<p>在打开自动聚焦时调用事件处理程序。\n可以被阻止。</p>\n',
    'type': '[event: Event]'
  },
  {
    'name': 'pointerDownOutside',
    'description': '<p>当 <code>pointerdown</code> 事件发生在 <code>DismissableLayer</code>外部时调用的事件处理程序。\n可以被阻止。</p>\n',
    'type': '[event: PointerDownOutsideEvent]'
  }
]" />
