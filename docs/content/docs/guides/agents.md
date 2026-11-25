---
title: Agents & WebMCP
description: Let AI agents read and operate Reka UI components through their own state, with three tools registered through WebMCP.
---

# Agents & WebMCP

<Description>
Let AI agents read and operate Reka UI components through their own state, with three tools registered through WebMCP.
</Description>

An agent that drives a page through the accessibility tree reads every element, clicks a trigger, waits for a popup, reads it again and clicks once more. The agent bridge in `reka-ui/agent` gives it three tools instead — `snapshot`, `query` and `act` — that read each component's state and change it through the component's own model, the same path a click or a key press takes. A whole task, like filling in a settings page and saving it, fits in one `act` call.

The bridge is opt-in. Nothing in it runs, and components do no extra work, until you create one.

<Callout type="tip">

The tools follow the shapes of the [UI SDK](https://github.com/vercel-labs/ui) agent bridge: the same names, inputs, outputs and descriptions. Agents and skills written for it work on a Reka UI page unchanged.

</Callout>

## Setup

Create the bridge **before** the app mounts. Components announce themselves to the bridge as they are set up, so components mounted before it exists aren't seen (native fields and buttons are, since the bridge reads those from the page).

```ts
import { createAgent, registerTools } from 'reka-ui/agent'
import { createApp } from 'vue'
import App from './App.vue'

const agent = createAgent({
  // Decide each step an agent asks to run. Return false (or a promise of false) to refuse it.
  allow: step => (step.confirm ? window.confirm(step.confirm) : true),
})

// Give the tools to the browser's own agent through WebMCP. A no-op where the browser has none.
registerTools(agent, {
  allow: step => step.action !== 'press' || window.confirm(`Let the assistant press "${step.args[0] ?? step.label}"?`),
})

createApp(App).mount('#app')
```

The same with the Vue plugin, which creates the bridge when the app is set up, provides it to `useAgent()` and removes it on `app.unmount()`:

```ts
import { AgentPlugin } from 'reka-ui/agent'

createApp(App)
  .use(AgentPlugin, { webmcp: { allow: () => true } })
  .mount('#app')
```

To drive the page with your own model, pass a tool call straight to the bridge: the three methods take the tools' inputs and return their outputs.

```ts
import { agentTools } from 'reka-ui/agent'

// Hand `agentTools` (name, description, inputSchema) to your model API, then:
const output = await agent[call.name](call.input)
```

## Tools

| Tool       | Input                                     | What it does                                                                                                                                                                                                                                                         |
| ---------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `act`      | `{ steps: [{ ref, action, args? }] }`     | Runs steps in order and stops at the first that fails. A step names a component by ref, label, row text or kind, and finds it behind closed tabs and accordion sections. Returns what each step changed and every field's value after.                               |
| `query`    | `{ text?, within?, kind?, closed?, from? }` | Finds components and list items without listing the page. `within` reads a list's items, 50 at a time with `from`. `closed: true` opens closed tabs and sections one at a time to read them, then goes back.                                                        |
| `snapshot` | `{}`                                      | Lists the components on the page: `ref`, `component`, `label`, `row`, state (`value`, `checked`, `open`…), `items` when there are 10 or fewer (`more` otherwise), `buttons`, `disabled` and `actions`. Components that left the page follow with `offPage: true`. |

Refs (`c1`, `c2`, …) stay the same while a component is mounted, and a component that comes back, like a field on a tab you return to, gets its old ref again.

```ts
await agent.act({
  steps: [
    { ref: 'Project name', action: 'setValue', args: ['Atlas'] },
    { ref: 'Visibility', action: 'setValue', args: ['Internal'] },
    { ref: 'Priya Shah', action: 'press', args: ['Make admin'] }, // opens her row's menu first
    { ref: 'Email > Deploy failures', action: 'setChecked', args: [true] }, // opens the tab and section
    { ref: 'Save settings', action: 'press' },
  ],
})
```

A step fails when its change didn't take, for example when a controlled `v-model` doesn't accept the value within about a second, when a number is outside the component's `min`/`max`, or when a choice names no item of the list.

`agent.subscribe(listener)` reports every change to a component, with `source: "agent"` for the ones a step made.

## Supported components

| Component                    | Agent kind                    | State                                | Actions                                                   |
| ---------------------------- | ----------------------------- | ------------------------------------ | --------------------------------------------------------- |
| Checkbox                     | `checkbox`                    | `checked`                            | `setChecked`, `toggle`                                    |
| Switch                       | `switch`                      | `checked`                            | `setChecked`, `toggle`                                    |
| Toggle                       | `toggle`                      | `pressed`                            | `setPressed`, `toggle`                                    |
| RadioGroup                   | `radio-group`                 | `value`, `items`                     | `setValue`                                                |
| ToggleGroup                  | `toggle-group`                | `value`, `items`                     | `setValue`, `toggle`                                      |
| Select                       | `select`                      | `value`, `open`, `items`             | `setValue`, `setOpen`                                     |
| Combobox                     | `combobox`                    | `value`, `open`, `query`             | `setValue`, `setOpen`, `setQuery`, `clear`                |
| Listbox                      | `listbox`                     | `value`, `items`                     | `setValue` (`clear` when multiple)                        |
| Tabs                         | `tabs`                        | `value`, `items`                     | `setValue`                                                |
| Accordion                    | `accordion`                   | `value`, `items`                     | `setValue`, `open`, `close`, `toggle` (`openAll`, `closeAll` when multiple) |
| Collapsible                  | `collapsible`                 | `open`                               | `setOpen`                                                 |
| Slider                       | `slider`                      | `value`, `min`, `max`, `step`        | `setValue`, `increment`, `decrement`                      |
| NumberField                  | `number-field`                | `value`, `min`, `max`, `step`        | `setValue`, `increment`, `decrement`, `clear`             |
| TagsInput                    | `tags-input`                  | `value`                              | `setValue`, `add`, `remove`, `clear`                      |
| PinInput                     | `pin-input`                   | `value` (always `"[redacted]"` when filled) | `setValue`, `clear`                          |
| Dialog, AlertDialog          | `dialog`, `alert-dialog`      | `open`, `text`, `buttons`            | `setOpen`, `press`                                        |
| DropdownMenu                 | `menu`                        | `open`, `buttons`                    | `setOpen`, `press` (opens the menu to press an item)     |
| Popover                      | `popover`                     | `open`, `buttons`                    | `setOpen`, `press`                                        |
| `<input>`, `<textarea>`      | `input`, `textarea`           | `value`                              | `setValue`, `clear`                                       |
| `<input type="checkbox">`    | `checkbox`                    | `checked`                            | `setChecked`, `toggle`                                    |
| `<select>`, radio inputs     | `select`, `radio-group`       | `value`, `items`                     | `setValue`                                                |
| `<button>`                   | `button`                      |                                      | `press`                                                   |

Native fields are set the way typing does — the value, then `input` and `change` events — so `v-model` hears them. A Combobox only knows its items while it is open: a `setValue` with an item's label opens it for a moment to read them, asking `allow` first. Components that aren't listed are read through their native elements where they have them.

A component that is disabled, read-only, inside a disabled `<fieldset>` or an `inert` element, or behind an open modal dialog or menu reports `disabled: true` and no actions, and a step that names something behind an open modal fails with the modal's name and buttons.

## Marks

Write these attributes on any element to decide what agents may see and do there:

| Attribute                             | Effect                                                                                                                                   |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `data-agent-hidden`                   | Agents never see what is inside. A step that names something inside gets the same answer as a name that isn't on the page, so a guess can't learn it's there. |
| `data-agent-secret`                   | Values inside read `"[redacted]"` when filled, item labels of lists inside read `"[redacted]"`, and text inside never appears in another component's label or row. Password, one-time-code and card fields, and every `PinInput`, are treated the same way without the attribute. |
| `data-agent-confirm="What it does."` | A change or press inside needs a person. Without `allow` the step fails with `Needs a person: "What it does."`; with `allow`, `allow` receives the sentence as `step.confirm` and decides. A change that touches several marked items gets every sentence. |

```vue-html
<section data-agent-hidden>…</section>
<input v-model="apiKey" data-agent-secret>
<div data-agent-confirm="Deletes the project for everyone.">
  <button @click="deleteProject">Delete project</button>
</div>
```

## Security notes

- Labels, text and items come from the page and can hold what its users wrote: an agent should treat them as data, never as instructions. The WebMCP tools carry `untrustedContentHint`, `act` carries `consequentialHint` and `snapshot` carries `readOnlyHint`.
- `registerTools` requires `allow`, because the browser's agent isn't one you wrote. It runs after `createAgent`'s own `allow`, and both must agree. `allow` also decides when a step opens a closed tab or section to look behind it.
- `act` and `query` run one at a time, so while a step waits on `allow` — a confirm the person has to answer — no other call can press that confirm.
- `timeout` (5 minutes by default) fails a step whose `allow` doesn't answer, so a forgotten prompt doesn't hold every later call.
- Mark destructive actions with `data-agent-confirm` and anything private with `data-agent-hidden` or `data-agent-secret`. The bridge only reaches what a person could reach on the page: nothing behind an open modal, nothing disabled.
- Marks follow components, not where their content lands: a mark around a Dialog, Popover, menu, Select or any other component also covers the content its portal renders in `body` or in a custom `to`, popups inside popups included. This holds for Reka UI's portals; content an app moves with Vue's own `<Teleport>` is read where it lands, so put the mark inside it too.
- Every change is checked against its marks right before it's made, after any wait on `allow`. A step stops if its target has left, become off-limits, gone behind a modal, or gained a mark the person wasn't shown. The same applies to each item a multi-item change picks, opens or closes, including the items `clear`, `openAll` and `closeAll` touch. `openAll` and `closeAll` leave disabled sections as they are.
- Closing a dialog, popover or menu with `setOpen(false)` needs a person when any button inside it is marked, since pressing that button would.
- A Listbox or Combobox choice clicks its item, so a `select` handler that calls `preventDefault()` stops an agent the same way it stops a person.
- One `act` call runs at most 100 steps, and `query` refuses inputs of the wrong type.
