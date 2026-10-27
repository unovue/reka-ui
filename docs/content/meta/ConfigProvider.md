<!-- This file was automatically generated. Do not edit it manually -->

<llm-exclude>
<PropsTable :data="[
  {
    'name': 'dir',
    'description': '<p>The global reading direction of your application. This will be inherited by all primitives.</p>\n',
    'type': '\'ltr\' | \'rtl\'',
    'required': false,
    'default': '\'ltr\''
  },
  {
    'name': 'locale',
    'description': '<p>The global locale of your application. This will be inherited by all primitives.</p>\n',
    'type': 'string',
    'required': false,
    'default': '\'en\''
  },
  {
    'name': 'nonce',
    'description': '<p>The global <code>nonce</code> value of your application. This will be inherited by the related primitives.</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'scrollBody',
    'description': '<p>How modal primitives lock page scroll. <code>true</code> keeps the layout stable with\n<code>scrollbar-gutter: stable</code> (or by pinning <code>&lt;body&gt;</code>\'s size where that is\nunsupported), <code>false</code> only hides the overflow, and <code>{ padding, margin }</code>\nhides the overflow and offsets <code>&lt;body&gt;</code> by the given amounts (<code>true</code> = the\nscrollbar width). The lock never touches <code>pointer-events</code>.</p>\n',
    'type': 'boolean | ScrollBodyOption',
    'required': false,
    'default': 'true'
  },
  {
    'name': 'teleportTo',
    'description': '<p>The global default teleport target for all portalled primitives (e.g. <code>Dialog</code>, <code>Popover</code>, <code>Tooltip</code>).\nIndividual <code>*Portal</code> components can still override this via their own <code>to</code> prop.\nWithout it, portals render into <code>body</code>, or into the shadow root they are rendered in.\nInside a shadow root, a selector is looked up in the shadow root first, then in the document.</p>\n',
    'type': 'string | HTMLElement',
    'required': false
  },
  {
    'name': 'useId',
    'description': '<p>The global <code>useId</code> injection as a workaround for preventing hydration issue.</p>\n',
    'type': '(() =&gt; string)',
    'required': false
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `dir` | The global reading direction of your application. This will be inherited by all primitives. | `"ltr" \| "rtl"` | No | `"ltr"` |
| `locale` | The global locale of your application. This will be inherited by all primitives. | `string` | No | `"en"` |
| `nonce` | The global nonce value of your application. This will be inherited by the related primitives. | `string` | No | - |
| `scrollBody` | How modal primitives lock page scroll. true keeps the layout stable with scrollbar-gutter: stable (or by pinning <body>'s size where that is unsupported), false only hides the overflow, and { padding, margin } hides the overflow and offsets <body> by the given amounts (true = the scrollbar width). The lock never touches pointer-events. | `boolean \| ScrollBodyOption` | No | `true` |
| `teleportTo` | The global default teleport target for all portalled primitives (e.g. Dialog, Popover, Tooltip). Individual *Portal components can still override this via their own to prop. Without it, portals render into body, or into the shadow root they are rendered in. Inside a shadow root, a selector is looked up in the shadow root first, then in the document. | `string \| HTMLElement` | No | - |
| `useId` | The global useId injection as a workaround for preventing hydration issue. | `(() => string)` | No | - |

</llm-only>
