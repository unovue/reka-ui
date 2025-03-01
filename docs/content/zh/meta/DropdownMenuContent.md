<PropsTable :data="[
  {
    'name': 'align',
    'description': '<p>相对触发器的首选对齐方式。发生碰撞时可能会发生变化。</p>\n',
    'type': '\'start\' | \'center\' | \'end\'',
    'required': false
  },
  {
    'name': 'alignOffset',
    'description': '<p>与<code>start</code>或<code>end</code>对齐选项的偏移量（以像素为单位）。</p>\n',
    'type': 'number',
    'required': false
  },
  {
    'name': 'arrowPadding',
    'description': '<p>箭头和内容边缘之间的填充。如果你的内容有 border-radius，这将防止它溢出角落。</p>\n',
    'type': 'number',
    'required': false
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
  },
  {
    'name': 'avoidCollisions',
    'description': '<p>如果<code>true</code>，则覆盖 side 和 align 首选项以防止与边界边发生碰撞。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'collisionBoundary',
    'description': '<p>用作碰撞边界的元素。默认情况下，这是视区，但您可以提供要包含在此检测中的其他元素。</p>\n',
    'type': 'Element | (Element | null)[] | null',
    'required': false
  },
  {
    'name': 'collisionPadding',
    'description': '<p>与应发生碰撞检测的边界边缘的距离（以像素为单位）。接受一个数字（所有边都相同）或部分 Padding 对象，例如：{ top: 20, left: 20 }。</p>\n',
    'type': 'number | Partial<Record<\'top\' | \'right\' | \'bottom\' | \'left\', number>>',
    'required': false
  },
  {
    'name': 'disableUpdateOnLayoutShift',
    'description': '<p>是否在布局移动时禁用内容的更新位置。</p>\n',
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
    'name': 'hideWhenDetached',
    'description': '<p>是否在触发器完全遮挡时隐藏内容。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'loop',
    'description': '<p>当<code>true</code>时，键盘导航将从最后一项循环到第一项，反之亦然。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'positionStrategy',
    'description': '<p>要使用的 CSS position 属性的类型。</p>\n',
    'type': '\'fixed\' | \'absolute\'',
    'required': false
  },
  {
    'name': 'prioritizePosition',
    'description': '<p>强制内容在视区中定位。</p>\n<p>可能会与 reference 元素重叠，这可能是不需要的。</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'reference',
    'description': '<p>将设置为参考的自定义元素或虚拟元素，以定位浮动元素。</p>\n<p>如果提供，它将替换默认的 anchor 元素。</p>\n',
    'type': 'ReferenceElement',
    'required': false
  },
  {
    'name': 'side',
    'description': '<p>触发器打开时要优先渲染的边。当发生碰撞并已启用 avoidCollisions 时将反转。</p>\n',
    'type': '\'top\' | \'right\' | \'bottom\' | \'left\'',
    'required': false
  },
  {
    'name': 'sideOffset',
    'description': '<p>距触发器的距离（以像素为单位）。</p>\n',
    'type': 'number',
    'required': false
  },
  {
    'name': 'sticky',
    'description': '<p>对齐轴上的粘滞行为。只要触发器至少部分位于边界中，<code>partial</code>就会将内容保留在边界中，而 <code>always</code> 将始终将内容保留在边界中。</p>\n',
    'type': '\'partial\' | \'always\'',
    'required': false
  },
  {
    'name': 'updatePositionStrategy',
    'description': '<p>更新每个动画帧上浮动元素位置的策略。</p>\n',
    'type': '\'always\' | \'optimized\'',
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
    'name': 'pointerDownOutside',
    'description': '<p>当 <code>pointerdown</code> 事件发生在 <code>DismissableLayer</code>外部时调用的事件处理程序。\n可以被阻止。</p>\n',
    'type': '[event: PointerDownOutsideEvent]'
  }
]" />
