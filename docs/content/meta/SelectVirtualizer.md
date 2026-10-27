<!-- This file was automatically generated. Do not edit it manually -->

<llm-exclude>
<PropsTable :data="[
  {
    'name': 'estimateSize',
    'description': '<p>Estimated size (in px) of each item. A function receives the row index (group header rows included).</p>\n',
    'type': 'number | ((index: number) =&gt; number)',
    'required': false
  },
  {
    'name': 'options',
    'description': '<p>List of items, or groups of items (<code>{ label, options, disabled? }</code>). Each\noption is the <code>value</code> of the <code>SelectItem</code> the default slot renders.</p>\n',
    'type': 'T[] | VirtualGroup&lt;T&gt;[]',
    'required': true
  },
  {
    'name': 'overscan',
    'description': '<p>Number of items rendered outside the visible area</p>\n',
    'type': 'number',
    'required': false
  },
  {
    'name': 'textContent',
    'description': '<p>Text content for each item, used by typeahead and by <code>SelectValue</code> while the item is not rendered. Required for object options.</p>\n',
    'type': '((option: T) =&gt; string)',
    'required': false
  }
]" />

<SlotsTable :data="[
  {
    'name': 'option',
    'description': '',
    'type': 'T'
  },
  {
    'name': 'virtualizer',
    'description': '',
    'type': 'Virtualizer&lt;HTMLElement, Element&gt;'
  },
  {
    'name': 'virtualItem',
    'description': '',
    'type': 'VirtualItem'
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `estimateSize` | Estimated size (in px) of each item. A function receives the row index (group header rows included). | `number \| ((index: number) => number)` | No | - |
| `options` | List of items, or groups of items ({ label, options, disabled? }). Each option is the value of the SelectItem the default slot renders. | `T[] \| VirtualGroup<T>[]` | Yes | - |
| `overscan` | Number of items rendered outside the visible area | `number` | No | - |
| `textContent` | Text content for each item, used by typeahead and by SelectValue while the item is not rendered. Required for object options. | `((option: T) => string)` | No | - |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `option` |  | `T` |
| `virtualizer` |  | `Virtualizer<HTMLElement, Element>` |
| `virtualItem` |  | `VirtualItem` |

</llm-only>
