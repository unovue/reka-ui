<PropsTable :data="[
  {
    'name': 'duration',
    'description': '<p>每个 Toast 保持可见的时间（以毫秒为单位）。</p>\n',
    'type': 'number',
    'required': false,
    'default': '5000'
  },
  {
    'name': 'label',
    'description': '<p>每个 Toast 的作者本地化标签。用于帮助屏幕阅读器用户将中断与 Toast 相关联。</p>\n',
    'type': 'string',
    'required': false,
    'default': '\'Notification\''
  },
  {
    'name': 'swipeDirection',
    'description': '<p>应该关闭 Toast 的指针滑动的方向。</p>\n',
    'type': '\'right\' | \'left\' | \'up\' | \'down\'',
    'required': false,
    'default': '\'right\''
  },
  {
    'name': 'swipeThreshold',
    'description': '<p>触发关闭前滑动必须经过的距离（以像素为单位）。</p>\n',
    'type': 'number',
    'required': false,
    'default': '50'
  }
]" />
