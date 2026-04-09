import type MarkdownIt from 'markdown-it'

const JSDOC_LINK_RE = /\{@link\s+(.*?)\}/

// Define a custom plugin to transform JSDoc @link tags
export function transformJSDocLinks(md: MarkdownIt) {
  md.core.ruler.push('transform-jsdoc-links', (state) => {
    state.tokens.forEach((token) => {
      if (token.type === 'inline' && token.children?.length) {
        for (let i = 0; i < token.children.length; i++) {
          const child = token.children[i]
          if (child.type === 'text' && child.content.startsWith('{@link')) {
            const matches = child.content.match(JSDOC_LINK_RE)
            if (matches) {
              const linkText = matches[1]
              const linkNode = new state.Token('link_open', 'a', 1)
              linkNode.attrSet('href', linkText)
              linkNode.attrSet('target', '_blank')
              const textNode = new state.Token('text', '', 0)
              textNode.content = 'reference'
              token.children.splice(i, 1, linkNode, textNode, new state.Token('link_close', 'a', -1))
              i += 2 // Skip the added link and text tokens
            }
          }
        }
      }
    })
  })
}
