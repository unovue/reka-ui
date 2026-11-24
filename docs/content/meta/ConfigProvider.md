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
    'description': '<p>How the body makes up for the scrollbar while scroll is locked. This will be inherited by the related primitives.\n<code>true</code> adds the scrollbar width to the body\'s right padding, and <code>false</code> leaves its padding and margin alone.\nAn object sets <code>padding</code> and <code>margin</code> separately: <code>true</code> adds the scrollbar width to the existing value,\na number is in px, and a string is used as written. With only <code>margin: true</code>, the margin makes up for the scrollbar and the padding is left alone.</p>\n',
    'type': 'boolean | ScrollBodyOption',
    'required': false,
    'default': 'true'
  },
  {
    'name': 'teleportTo',
    'description': '<p>The global default teleport target for all portalled primitives (e.g. <code>Dialog</code>, <code>Popover</code>, <code>Tooltip</code>).\nIndividual <code>*Portal</code> components can still override this via their own <code>to</code> prop.\nUseful when rendering inside a custom element / shadow DOM.</p>\n',
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
| `scrollBody` | How the body makes up for the scrollbar while scroll is locked. This will be inherited by the related primitives. true adds the scrollbar width to the body's right padding, and false leaves its padding and margin alone. An object sets padding and margin separately: true adds the scrollbar width to the existing value, a number is in px, and a string is used as written. With only margin: true, the margin makes up for the scrollbar and the padding is left alone. | `boolean \| ScrollBodyOption` | No | `true` |
| `teleportTo` | The global default teleport target for all portalled primitives (e.g. Dialog, Popover, Tooltip). Individual *Portal components can still override this via their own to prop. Useful when rendering inside a custom element / shadow DOM. | `string \| HTMLElement` | No | - |
| `useId` | The global useId injection as a workaround for preventing hydration issue. | `(() => string)` | No | - |

</llm-only>
