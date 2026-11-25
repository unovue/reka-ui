import type { VNode } from 'vue'
import type { Agent, AgentComponent, ObservedChange } from '.'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { AccordionContent, AccordionHeader, AccordionItem, AccordionRoot, AccordionTrigger } from '@/Accordion'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuTrigger } from '@/DropdownMenu'
import { SwitchRoot } from '@/Switch'
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from '@/Tabs'
import { agentTools, createAgent } from '.'

let agent: Agent | undefined

async function setup(render: () => VNode | VNode[], options?: Parameters<typeof createAgent>[0]) {
  agent = createAgent(options)
  const wrapper = mount(defineComponent({ render }), { attachTo: document.body })
  await nextTick()
  return { agent, wrapper }
}

afterEach(() => {
  agent?.destroy()
  agent = undefined
  document.body.innerHTML = ''
})

const labelled = (label: string, attrs: Record<string, unknown> = {}) => h(SwitchRoot, { 'aria-label': label, ...attrs })

describe('tools', () => {
  it('lists act, query and snapshot, in that order, as JSON Schema', () => {
    expect(agentTools.map(tool => tool.name)).toEqual(['act', 'query', 'snapshot'])
    for (const tool of agentTools)
      expect(tool).toEqual({ name: tool.name, description: expect.any(String), inputSchema: expect.objectContaining({ type: 'object' }) })
    expect(agentTools[0]!.inputSchema).toMatchObject({ required: ['steps'], additionalProperties: false })
    expect(agentTools[1]!.inputSchema).toMatchObject({ properties: { text: { type: 'string' }, within: { type: 'string' }, kind: { type: 'string' }, closed: { type: 'boolean' }, from: { type: 'integer' } } })
    agent = createAgent()
    expect(agent.tools).toBe(agentTools)
  })
})

describe('act', () => {
  it('rejects a call with the wrong shape before any step runs', async () => {
    const { agent, wrapper } = await setup(() => labelled('Wi-Fi'))
    const result = await agent.act({ steps: [{ ref: 'Wi-Fi', action: 'setChecked', args: [true] }, { ref: 'Wi-Fi', action: 'setChecked', value: true } as any] })
    expect(result.ok).toBe(false)
    expect(result.error).toEqual({ step: 1, message: expect.stringContaining('steps[1] has "value", which a step doesn\'t take') })
    expect(result.error!.message).toContain('No step ran.')
    expect(result.steps).toEqual([])
    expect(wrapper.findComponent(SwitchRoot).emitted('update:modelValue')).toBeUndefined()
    expect((await agent.act([] as any)).error!.message).toContain('not a list on its own')
    expect((await agent.act({ steps: [{ ref: 'Wi-Fi', action: 'setChecked' }] })).error!.message).toContain('needs its value')
  })

  it('runs steps in order, stops at the first failure and keeps what ran', async () => {
    const { agent, wrapper } = await setup(() => [labelled('Wi-Fi'), labelled('Bluetooth')])
    const result = await agent.act({
      steps: [
        { ref: 'Wi-Fi', action: 'setChecked', args: [true] },
        { ref: 'Airplane mode', action: 'setChecked', args: [true] },
        { ref: 'Bluetooth', action: 'setChecked', args: [true] },
      ],
    })
    expect(result.ok).toBe(false)
    expect(result.error!.step).toBe(1)
    expect(result.error!.message).toContain('No component "Airplane mode" on the page. Its labels: Wi-Fi, Bluetooth.')
    expect(result.error!.message).toContain('The steps before this one stay done.')
    expect(result.error!.message).toContain('Send it again with the step after it, 2 steps in one call.')
    expect(result.steps).toHaveLength(1)
    const [wifi, bluetooth] = wrapper.findAllComponents(SwitchRoot)
    expect(wifi!.emitted('update:modelValue')).toEqual([[true]])
    expect(bluetooth!.emitted('update:modelValue')).toBeUndefined()
  })

  it('finds a component by ref, label words, row text and kind, case- and accent-insensitive', async () => {
    const { agent } = await setup(() => h('ul', [
      h('li', [h('span', 'Zoë Durand'), labelled('Notifications for Zoë')]),
      h('li', [h('span', 'Jane Doe'), labelled('Notifications for Jane')]),
    ]))
    const [zoe] = agent.snapshot()
    expect(zoe).toMatchObject({ label: 'Notifications for Zoë', row: 'Zoë Durand' })
    expect((await agent.act({ steps: [{ ref: zoe!.ref, action: 'setChecked', args: [true] }] })).ok).toBe(true)
    expect((await agent.act({ steps: [{ ref: 'zoe durand', action: 'expect', args: [true] }] })).ok).toBe(true)
    expect((await agent.act({ steps: [{ ref: 'JANE', action: 'setChecked', args: [true] }] })).ok).toBe(true)
    const ambiguous = await agent.act({ steps: [{ ref: 'Notifications', action: 'setChecked', args: [false] }] })
    expect(ambiguous.error!.message).toMatch(/"Notifications" names 2 components: c\d+ Notifications for Zoë \(Zoë Durand\), c\d+ Notifications for Jane \(Jane Doe\)\. Use a ref/)
    expect((await agent.act({ steps: [{ ref: 'switch', action: 'toggle' }] })).error!.message).toContain('names 2 components')
  })

  it('expect fails when the value is not what it says, and changes nothing', async () => {
    const { agent } = await setup(() => labelled('Wi-Fi'))
    const result = await agent.act({ steps: [{ ref: 'Wi-Fi', action: 'expect', args: [true] }, { ref: 'Wi-Fi', action: 'toggle' }] })
    expect(result.error).toMatchObject({ step: 0, message: expect.stringMatching(/Wi-Fi \(c\d+\) is false, not true\./) })
  })

  it('fails a set step whose value didn\'t take, like one a controlled parent turns down', async () => {
    const { agent } = await setup(() => labelled('Locked', { 'modelValue': false, 'onUpdate:modelValue': () => {} }))
    const result = await agent.act({ steps: [{ ref: 'Locked', action: 'setChecked', args: [true] }] })
    expect(result.error!.message).toMatch(/setChecked on Locked \(c\d+\) didn't take: it is still false\./)
  }, 10000)

  it('waits for a parent that takes the value a moment later', async () => {
    const checked = ref(false)
    const { agent } = await setup(() => labelled('Slow', { 'modelValue': checked.value, 'onUpdate:modelValue': (value: boolean) => setTimeout(() => (checked.value = value), 150) }))
    const result = await agent.act({ steps: [{ ref: 'Slow', action: 'setChecked', args: [true] }] })
    expect(result.ok).toBe(true)
    expect(checked.value).toBe(true)
  })

  it('reports disabled components with no actions, and refuses steps on them', async () => {
    const { agent } = await setup(() => labelled('Off', { disabled: true }))
    expect(agent.snapshot()[0]).toMatchObject({ label: 'Off', disabled: true, actions: [] })
    expect((await agent.act({ steps: [{ ref: 'Off', action: 'setChecked', args: [true] }] })).error!.message).toContain('takes no setChecked now')
  })
})

describe('marks', () => {
  it('leaves out what is inside data-agent-hidden, and a step naming it hears what a missing name does', async () => {
    const { agent } = await setup(() => [labelled('Visible'), h('div', { 'data-agent-hidden': '' }, [labelled('Internal flag')])])
    expect(agent.snapshot().map(component => component.label)).toEqual(['Visible'])
    const hidden = await agent.act({ steps: [{ ref: 'Internal flag', action: 'setChecked', args: [true] }] })
    const missing = await agent.act({ steps: [{ ref: 'Nothing here', action: 'setChecked', args: [true] }] })
    expect(hidden.error!.message).toBe(missing.error!.message.replace('Nothing here', 'Internal flag'))
  })

  it('redacts secret and password values', async () => {
    const { agent } = await setup(() => [
      h('input', { 'aria-label': 'Token', 'value': 'abc', 'data-agent-secret': '' }),
      h('input', { 'aria-label': 'PIN', 'value': '1234', 'autocomplete': 'one-time-code' }),
      h('input', { 'aria-label': 'Empty password', 'type': 'password' }),
    ])
    expect(agent.snapshot().map(component => component.value)).toEqual(['[redacted]', '[redacted]', ''])
    const result = await agent.act({ steps: [{ ref: 'Token', action: 'setValue', args: ['xyz'] }] })
    expect(result.ok).toBe(true)
    expect(JSON.stringify(result)).not.toContain('xyz')
    expect((await agent.act({ steps: [{ ref: 'Token', action: 'expect', args: ['xyz'] }] })).error!.message).toContain('is private')
  })

  it('a data-agent-confirm press needs a person without allow, and asks allow with the sentence', async () => {
    const onDelete = vi.fn()
    const render = () => h('div', { 'data-agent-confirm': 'Deletes the project for everyone.' }, [h('button', { type: 'button', onClick: onDelete }, 'Delete project')])
    const { agent: alone } = await setup(render)
    expect(alone.snapshot()[0]).toMatchObject({ label: 'Delete project', confirm: 'Deletes the project for everyone.' })
    const result = await alone.act({ steps: [{ ref: 'Delete project', action: 'press' }] })
    expect(result.error!.message).toBe('Needs a person: "Deletes the project for everyone.". Ask them to press "Delete project" themselves.')
    expect(onDelete).not.toHaveBeenCalled()

    const allow = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true)
    const asked = createAgent({ allow })
    alone.destroy()
    agent = asked
    const refused = await asked.act({ steps: [{ ref: 'Delete project', action: 'press' }] })
    expect(refused.error!.message).toBe('The person said no to "Deletes the project for everyone.".')
    expect((await asked.act({ steps: [{ ref: 'Delete project', action: 'press' }] })).ok).toBe(true)
    expect(allow).toHaveBeenLastCalledWith(expect.objectContaining({ action: 'press', component: 'button', label: 'Delete project', confirm: 'Deletes the project for everyone.' }), { signal: expect.any(AbortSignal) })
    expect(onDelete).toHaveBeenCalledOnce()
  })

  it('allow can refuse any step, and a step that waits too long fails', async () => {
    const { agent: refusing } = await setup(() => labelled('Wi-Fi'), { allow: step => step.label !== 'Wi-Fi' })
    expect((await refusing.act({ steps: [{ ref: 'Wi-Fi', action: 'toggle' }] })).error!.message).toMatch(/The app refused toggle on c\d+\./)
    agent = createAgent({ allow: () => new Promise(() => {}), timeout: 50 })
    refusing.destroy()
    expect((await agent.act({ steps: [{ ref: 'Wi-Fi', action: 'toggle' }] })).error!.message).toMatch(/No answer to toggle on c\d+ in 0 seconds\./)
  })
})

describe('refs', () => {
  const screen = () => h(TabsRoot, { defaultValue: 'a' }, () => [
    h(TabsList, { 'aria-label': 'Tabs' }, () => [h(TabsTrigger, { value: 'a' }, () => 'A'), h(TabsTrigger, { value: 'b' }, () => 'B')]),
    h(TabsContent, { value: 'a' }, () => labelled('On A')),
    h(TabsContent, { value: 'b' }, () => labelled('On B')),
  ])

  it('keep a component\'s ref while it is mounted, and give it back when it returns', async () => {
    const { agent } = await setup(screen)
    const first = agent.snapshot().find(component => component.label === 'On A')!
    expect(agent.snapshot().find(component => component.label === 'On A')!.ref).toBe(first.ref)
    await agent.act({ steps: [{ ref: 'On A', action: 'setChecked', args: [true] }, { ref: 'Tabs', action: 'setValue', args: ['B'] }] })
    const away = agent.snapshot()
    // What left the page is listed with the state it had.
    expect(away.find(component => component.ref === first.ref)).toMatchObject({ label: 'On A', offPage: true, checked: true, actions: [] })
    await agent.act({ steps: [{ ref: 'Tabs', action: 'setValue', args: ['A'] }] })
    const back = agent.snapshot().find(component => component.label === 'On A')!
    expect(back.ref).toBe(first.ref)
    expect(back.offPage).toBeUndefined()
  })

  it('query closed: true reads other tabs and closed sections, and goes back', async () => {
    const { agent, wrapper } = await setup(() => [
      screen(),
      h(AccordionRoot, { type: 'single', collapsible: true }, () => ['x', 'y'].map(value => h(AccordionItem, { value }, () => [
        h(AccordionHeader, () => h(AccordionTrigger, () => `Section ${value}`)),
        h(AccordionContent, () => labelled(`Switch ${value}`)),
      ]))),
    ])
    const found = await agent.query({ closed: true }) as AgentComponent[]
    expect(found.filter(component => component.offPage).map(component => [component.label, component.section])).toEqual([
      ['On B', 'B'],
      ['Switch x', 'Section x'],
      ['Switch y', 'Section y'],
    ])
    // Every place it opened, it closed again.
    expect(wrapper.findComponent(TabsRoot).emitted('update:modelValue')).toEqual([['b'], ['a']])
    expect(wrapper.findComponent(AccordionRoot).emitted('update:modelValue')).toEqual([['x'], [undefined], ['y'], [undefined]])
    expect(agent.snapshot().find(component => component.label === 'On B')).toMatchObject({ offPage: true })
    expect(await agent.query({ text: 'switch', kind: 'switch' })).toMatchObject([{ label: 'Switch x', offPage: true }, { label: 'Switch y', offPage: true }])
  })

  it('a name two closed sections share is refused, and "Section > name" picks one', async () => {
    const { agent } = await setup(() => h(AccordionRoot, { type: 'single', collapsible: true }, () => ['Email', 'Slack'].map(value => h(AccordionItem, { value }, () => [
      h(AccordionHeader, () => h(AccordionTrigger, () => value)),
      h(AccordionContent, () => labelled('Deploy failures')),
    ]))))
    const ambiguous = await agent.act({ steps: [{ ref: 'Deploy failures', action: 'setChecked', args: [true] }] })
    expect(ambiguous.error!.message).toContain('"Deploy failures" is in 2 closed sections: Email, Slack. Put the one you mean first, like "Email > Deploy failures".')
    const result = await agent.act({ steps: [{ ref: 'Slack > Deploy failures', action: 'setChecked', args: [true] }] })
    expect(result.ok).toBe(true)
    expect(Object.entries(result.values).find(([key]) => key.endsWith('Deploy failures'))).toEqual([expect.stringMatching(/^c\d+ Slack > Deploy failures$/), true])
  })
})

describe('long pages', () => {
  it('a snapshot of more than 100 ends with a "more" entry, keeping open popups', async () => {
    const { agent } = await setup(() => [
      ...Array.from({ length: 120 }, (_, index) => labelled(`Switch ${index}`)),
      h(DropdownMenuRoot, { defaultOpen: true }, () => [
        h(DropdownMenuTrigger, { 'aria-label': 'Open menu' }, () => '⋯'),
        h(DropdownMenuPortal, () => h(DropdownMenuContent, () => h(DropdownMenuItem, () => 'Item'))),
      ]),
    ])
    await nextTick()
    const snapshot = agent.snapshot()
    expect(snapshot).toHaveLength(101)
    expect(snapshot.at(-1)).toEqual({ ref: 'more', component: 'more', more: 21, use: 'query', actions: [] })
    expect(snapshot.some(component => component.label === 'Open menu' && component.open === true)).toBe(true)
  })
})

describe('subscribe', () => {
  it('reports the agent\'s changes with the source "agent", and a person\'s otherwise', async () => {
    const { agent, wrapper } = await setup(() => labelled('Wi-Fi'))
    const changes: ObservedChange[] = []
    const stop = agent.subscribe(change => changes.push(change))
    await agent.act({ steps: [{ ref: 'Wi-Fi', action: 'setChecked', args: [true] }] })
    await wrapper.find('button').trigger('click')
    stop()
    await wrapper.find('button').trigger('click')
    expect(changes).toEqual([
      expect.objectContaining({ component: 'switch', label: 'Wi-Fi', key: 'checked', value: true, previous: false, source: 'agent' }),
      expect.objectContaining({ key: 'checked', value: false, previous: true, source: 'programmatic' }),
    ])
  })
})
