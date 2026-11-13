import type { MarkdownRenderer } from 'vitepress'
import { version } from '../../../package.json'

export const PACKAGE_MANAGERS = ['npm', 'pnpm', 'yarn', 'bun'] as const

// A prerelease is published under its own dist-tag (`3.0.0-alpha.0` → `alpha`),
// so its docs must not install `latest`, which is the previous major.
const prerelease = version.split('+')[0].split('-')[1]
const distTag = prerelease?.split('.')[0]

function withDistTag(packages: string) {
  if (!distTag)
    return packages
  return packages.split(' ').map(name => name === 'reka-ui' ? `reka-ui@${distTag}` : name).join(' ')
}

export default function (md: MarkdownRenderer) {
  md.core.ruler.after('inline', 'component-preview', (state) => {
    // Define the regular expression to match the desired pattern
    const regex = /<InstallationTabs value="([^"]+)" \/>/g

    // Iterate through the Markdown content and replace the pattern
    state.src = state.src.replace(regex, (match, packagesString) => {
      const index = state.tokens.findIndex(i => i.content.match(regex))
      state.tokens[index].content = `<InstallationTabs value="${packagesString}">`

      const dummyToken = new state.Token('', '', 0)
      const tokenArray: Array<typeof dummyToken> = []

      PACKAGE_MANAGERS.forEach((value) => {
        const templateStart = new state.Token('html_inline', '', 0)
        templateStart.content = `<template #${value}>`
        tokenArray.push(templateStart)

        const token = new state.Token('fence', 'code', 0)
        token.content = `$ ${value} add ${withDistTag(packagesString)}`
        token.info = `sh [${value}]`
        tokenArray.push(token)

        const templateEnd = new state.Token('html_inline', '', 0)
        templateEnd.content = '</template>'
        tokenArray.push(templateEnd)
      })

      const endTag = new state.Token('html_inline', '', 0)
      endTag.content = '</InstallationTabs>'
      tokenArray.push(endTag)

      state.tokens.splice(index + 1, 0, ...tokenArray)

      // Return an empty string to replace the original pattern
      return ''
    })
  })
}
