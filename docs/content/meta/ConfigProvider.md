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
    'description': '<p>The global scroll body behavior of your application. This will be inherited by the related primitives.</p>\n',
    'type': 'boolean | ScrollBodyOption',
    'required': false,
    'default': 'true'
  },
  {
    'name': 'useId',
    'description': '<p>The global <code>useId</code> injection as a workaround for preventing hydration issue.</p>\n',
    'type': '(() =&gt; string)',
    'required': false
  }
]" />

<MethodsTable :data="[
  {
    'name': 'useId',
    'description': '<p>The global <code>useId</code> injection as a workaround for preventing hydration issue.</p>\n',
    'type': '() =&gt; string'
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
| `scrollBody` | The global scroll body behavior of your application. This will be inherited by the related primitives. | `boolean \| ScrollBodyOption` | No | `true` |
| `useId` | The global useId injection as a workaround for preventing hydration issue. | `(() => string)` | No | - |

**Methods**

| Name | Description | Type |
| --- | --- | --- |
| `useId` | The global useId injection as a workaround for preventing hydration issue. | `() => string` |

</llm-only>
