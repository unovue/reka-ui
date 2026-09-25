<!-- This file was automatically generated. Do not edit it manually -->

<llm-exclude>
<PropsTable :data="[
  {
    'name': 'cspSafePositioning',
    'description': '<p>When <code>true</code>, floating/popper components (e.g. <code>Popover</code>, <code>Tooltip</code>, <code>Select</code>) apply their\npositioning styles on the client after mount instead of emitting inline <code>style</code> attributes\nduring SSR. This avoids <code>style-src</code> CSP violations on the server-rendered markup for apps\nrunning a strict Content Security Policy without <code>\'unsafe-inline\'</code>.</p>\n<p>Inline <code>style</code> attributes serialized during SSR cannot be allowed by a <code>nonce</code> (nonces only\napply to <code>&lt;style&gt;</code>/<code>&lt;link&gt;</code> elements), so this is the way to keep SSR output CSP-clean.\nDefault <code>false</code> — no change to existing behavior.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
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
| `cspSafePositioning` | When true, floating/popper components (e.g. Popover, Tooltip, Select) apply their positioning styles on the client after mount instead of emitting inline style attributes during SSR. This avoids style-src CSP violations on the server-rendered markup for apps running a strict Content Security Policy without 'unsafe-inline'. Inline style attributes serialized during SSR cannot be allowed by a nonce (nonces only apply to <style>/<link> elements), so this is the way to keep SSR output CSP-clean. Default false — no change to existing behavior. | `boolean` | No | `false` |
| `dir` | The global reading direction of your application. This will be inherited by all primitives. | `"ltr" \| "rtl"` | No | `"ltr"` |
| `locale` | The global locale of your application. This will be inherited by all primitives. | `string` | No | `"en"` |
| `nonce` | The global nonce value of your application. This will be inherited by the related primitives. | `string` | No | - |
| `scrollBody` | The global scroll body behavior of your application. This will be inherited by the related primitives. | `boolean \| ScrollBodyOption` | No | `true` |
| `teleportTo` | The global default teleport target for all portalled primitives (e.g. Dialog, Popover, Tooltip). Individual *Portal components can still override this via their own to prop. Useful when rendering inside a custom element / shadow DOM. | `string \| HTMLElement` | No | - |
| `useId` | The global useId injection as a workaround for preventing hydration issue. | `(() => string)` | No | - |

</llm-only>
