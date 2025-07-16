import { writeFileSync } from 'node:fs'
import { components } from 'reka-ui/constant'

const excludedComponent = ['configProvider', 'primitive', 'visuallyHidden']
const filteredComponent = Object.keys(components).filter(i => !excludedComponent.includes(i))
const flattenComponents = Object.values(components).flat()

const namespaced = filteredComponent.map((curr: keyof typeof components) => {
  const key = curr.charAt(0).toUpperCase() + curr.slice(1)
  const tmp: Record<string, string> = {}

  const values = components[curr]
  values.forEach((val) => {
    const truncated = val.replace(key, '')
    if (truncated)
      tmp[truncated] = val
  })

  if (Object.keys(tmp).length === 0) {
    return `export { ${key} }`
  }
  else {
    return `export const ${key} = {\n${
      Object.keys(tmp).map((k) => { return `  ${k}: ${tmp[k]},\n` }).join('')
    }}  as {\n${Object.keys(tmp).map((k) => {
      return `  ${k}: typeof ${tmp[k]}\n`
    }).join('')}}`
  }
})

const template = `
import { ${flattenComponents.join(', ')} } from 'reka-ui'

${namespaced.map(component => component).join('\n\n')}
`

writeFileSync('src/namespaced/index.ts', template, 'utf-8')
