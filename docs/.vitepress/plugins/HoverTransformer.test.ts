import { createMarkdownRenderer } from 'vitepress'
import { describe, expect, it } from 'vitest'
import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createHoverTransformer } from './HoverTransformer'

const fence = '```'

// VitePress compiles a page's HTML as a Vue template, so a code block must show
// the `{{ }}` it contains instead of evaluating it.
describe('createHoverTransformer', () => {
  it('should keep `{{ }}` on a line with a component literal', async () => {
    const markdown = `${fence}vue\n<template>\n  <SelectItemText>{{ fruit.label }}</SelectItemText>\n</template>\n${fence}\n`
    const md = await createMarkdownRenderer(process.cwd(), { codeTransformers: [createHoverTransformer()] })
    const template = md.render(markdown)

    const Page = defineComponent({
      template,
      components: {
        LinkHoverCard: defineComponent((_, { slots }) => () => h('span', { 'data-hover-card': '' }, slots.default?.())),
        LinkHoverCardContent: defineComponent(() => () => null),
      },
    })
    const html = await renderToString(createSSRApp(Page))

    // The component name still gets its hover card.
    expect(html).toMatch(/<span data-hover-card[^>]*>SelectItemText<\/span>/)
    expect(html).toContain('{{ fruit.label }}')
  })
})
