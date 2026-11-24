<!-- This file was automatically generated. Do not edit it manually -->

<llm-exclude>
<PropsTable :data="[
  {
    'name': 'disableHoverPause',
    'description': '<p>When <code>true</code>, toasts keep counting down while the pointer is over the viewport, so a toast\ncan close while a pointer user is still reading it. Best kept to short status toasts\nwithout actions. Keyboard focus inside the viewport and a press or swipe on a toast\nalways pause the toasts.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'disableSwipe',
    'description': '<p>Whether to disable the ability to swipe to close the toast.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'disableWindowBlurPause',
    'description': '<p>When <code>true</code>, toasts keep counting down while the window is not focused, so a toast can\nclose before the user comes back to the page. Keyboard focus inside the viewport still\npauses the toasts until the window is focused again.</p>\n',
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
| `disableHoverPause` | When true, toasts keep counting down while the pointer is over the viewport, so a toast can close while a pointer user is still reading it. Best kept to short status toasts without actions. Keyboard focus inside the viewport and a press or swipe on a toast always pause the toasts. | `boolean` | No | - |
| `disableSwipe` | Whether to disable the ability to swipe to close the toast. | `boolean` | No | - |
| `disableWindowBlurPause` | When true, toasts keep counting down while the window is not focused, so a toast can close before the user comes back to the page. Keyboard focus inside the viewport still pauses the toasts until the window is focused again. | `boolean` | No | - |
| `duration` | Time in milliseconds that each toast should remain visible for. | `number` | No | `5000` |
| `label` | An author-localized label for each toast. Used to help screen reader users associate the interruption with a toast. | `string` | No | `"Notification"` |
| `limit` | The maximum number of toasts shown at once. Older toasts beyond the limit get data-limited and inert rather than being removed, so they can be hidden or animated. No limit is applied when unset. | `number` | No | - |
| `swipeDirection` | Direction of pointer swipe that should close the toast. | `"right" \| "left" \| "down" \| "up"` | No | `"right"` |
| `swipeThreshold` | Distance in pixels that the swipe must pass before a close is triggered. | `number` | No | `50` |
| `toastManager` | A manager created with createToastManager(), to add toasts from outside components. Its toasts are listed by useToastManager(). | `GlobalToastManager<any>` | No | - |

</llm-only>
