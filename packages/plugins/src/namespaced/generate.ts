import { writeFileSync } from 'node:fs'
import { components } from 'reka-ui/constant'

const excludedComponents = ['configProvider', 'primitive', 'visuallyHidden']
const filteredComponents = (Object.keys(components) as Array<keyof typeof components>).filter(component => !excludedComponents.includes(component))

const flattenedComponents = filteredComponents.flatMap(component => components[component])
const namespacedComponents = filteredComponents.map((component) => {
  const key = component.charAt(0).toUpperCase() + component.slice(1)
  const entries = components[component]
    .map(value => [value.replace(key, ''), value] as const)
    .filter(([name]) => Boolean(name))

  if (entries.length === 0) {
    return `export { ${key} }`
  }

  return `export const ${key} = {\n${
    entries.map(([name, value]) => `  ${name}: ${value},\n`).join('')
  }} as {\n${
    entries.map(([name, value]) => `  ${name}: typeof ${value}\n`).join('')
  }}`
})

const template = `import { ${flattenedComponents.join(', ')} } from 'reka-ui'\n\n${namespacedComponents.join('\n\n')}\n`

writeFileSync('src/namespaced/index.ts', template, 'utf-8')
