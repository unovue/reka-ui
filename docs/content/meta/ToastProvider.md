<!-- This file was automatically generated. Do not edit it manually -->

<llm-exclude>
<PropsTable :data="[
  {
    'name': 'disableSwipe',
    'description': '<p>Whether to disable the ability to swipe to close the toast.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'duration',
    'description': '<p>Time in milliseconds that each toast should remain visible for.</p>\n',
    'type': 'number',
    'required': false,
    'default': '5000'
  },
  {
    'name': 'label',
    'description': '<p>An author-localized label for each toast. Used to help screen reader users\nassociate the interruption with a toast.</p>\n',
    'type': 'string',
    'required': false,
    'default': '\'Notification\''
  },
  {
    'name': 'limit',
    'description': '<p>The maximum number of toasts shown at once. Older toasts beyond the limit get\n<code>data-limited</code> and <code>inert</code> rather than being removed, so they can be hidden or animated.\nNo limit is applied when unset.</p>\n',
    'type': 'number',
    'required': false
  },
  {
    'name': 'pauseOnInteraction',
    'description': '<p>Whether to pause the toast duration while the viewport is hovered, focused, or the window is blurred.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'true'
  },
  {
    'name': 'swipeDirection',
    'description': '<p>Direction of pointer swipe that should close the toast.</p>\n',
    'type': '\'right\' | \'left\' | \'down\' | \'up\'',
    'required': false,
    'default': '\'right\''
  },
  {
    'name': 'swipeThreshold',
    'description': '<p>Distance in pixels that the swipe must pass before a close is triggered.</p>\n',
    'type': 'number',
    'required': false,
    'default': '50'
  },
  {
    'name': 'toastManager',
    'description': '<p>A manager created with <code>createToastManager()</code>, to add toasts from outside\ncomponents. Its toasts are listed by <code>useToastManager()</code>.</p>\n',
    'type': 'GlobalToastManager&lt;any&gt;',
    'required': false
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `disableSwipe` | Whether to disable the ability to swipe to close the toast. | `boolean` | No | - |
| `duration` | Time in milliseconds that each toast should remain visible for. | `number` | No | `5000` |
| `label` | An author-localized label for each toast. Used to help screen reader users associate the interruption with a toast. | `string` | No | `"Notification"` |
| `limit` | The maximum number of toasts shown at once. Older toasts beyond the limit get data-limited and inert rather than being removed, so they can be hidden or animated. No limit is applied when unset. | `number` | No | - |
| `pauseOnInteraction` | Whether to pause the toast duration while the viewport is hovered, focused, or the window is blurred. | `boolean` | No | `true` |
| `swipeDirection` | Direction of pointer swipe that should close the toast. | `"right" \| "left" \| "down" \| "up"` | No | `"right"` |
| `swipeThreshold` | Distance in pixels that the swipe must pass before a close is triggered. | `number` | No | `50` |
| `toastManager` | A manager created with createToastManager(), to add toasts from outside components. Its toasts are listed by useToastManager(). | `GlobalToastManager<any>` | No | - |

</llm-only>
