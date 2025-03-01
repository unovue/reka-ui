<PropsTable :data="[
  {
    'name': 'estimateSize',
    'description': '<p>每项的预计大小（以 px 为单位）</p>\n',
    'type': 'number',
    'required': false
  },
  {
    'name': 'overscan',
    'description': '<p>在可见区域之外渲染的项数量</p>\n',
    'type': 'number',
    'required': false
  },
  {
    'name': 'textContent',
    'description': '<p>每个项的文本内容以实现提前键入（type-ahead）功能</p>\n',
    'type': '((item: Record<string, any>) => string)',
    'required': false
  }
]" />

<SlotsTable :data="[
  {
    'name': 'item',
    'description': '',
    'type': 'FlattenedItem<Record<string, any>>'
  },
  {
    'name': 'virtualizer',
    'description': '',
    'type': 'Virtualizer<Element | Window, Element>'
  },
  {
    'name': 'virtualItem',
    'description': '',
    'type': 'VirtualItem'
  }
]" />
