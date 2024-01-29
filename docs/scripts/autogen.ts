import { join, parse, resolve } from 'node:path'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import fg from 'fast-glob'
import MarkdownIt from 'markdown-it'
import type { ComponentMeta, MetaCheckerOptions } from 'vue-component-meta'
import { createComponentMetaChecker } from 'vue-component-meta'
import { babelParse, parse as sfcParse } from 'vue/compiler-sfc'
import _traverse from '@babel/traverse'
import { components } from '../../packages/radix-vue/constant/components'
import { fileURLToPath } from 'node:url'

// @ts-expect-error ignore
const traverse = _traverse.default as typeof _traverse
const __dirname = fileURLToPath(new URL('.', import.meta.url))

const md = new MarkdownIt()

const checkerOptions: MetaCheckerOptions = {
  forceUseTs: true,
  printer: { newLine: 1 },
}

const tsconfigChecker = createComponentMetaChecker(
  resolve(__dirname, '../../packages/radix-vue/tsconfig.json'),
  checkerOptions,
)

const eventDescriptionMap = new Map<string, string>()
const depTree = new Map<string, string[]>()
let prevDeps: string[] = []

const allComponents = fg.sync(['src/**/*.vue', '!src/**/story/*.vue', '!src/**/*.story.vue'], {
  cwd: resolve(__dirname, '../../packages/radix-vue'),
  absolute: true,
})

const listOfComponents = Object.values(components).flatMap(i => i)
const primitiveComponents = allComponents.filter(i => listOfComponents.includes(parse(i).name))

// 1. Generate all the dependencies for each components
allComponents.forEach((i) => {
  generateDependencies(i)
})

// 2. Generate component meta
primitiveComponents.forEach((componentPath) => {
  const dir = parse(componentPath).dir.split('/').at(-1) ?? ''
  const flattenDeps = [dir, ...getDependencies(dir)]
  if (!arraysAreEqual(prevDeps, flattenDeps)) {
    flattenDeps.forEach((dep) => {
      getEventFromComponentPath(dep)
    })
    prevDeps = flattenDeps
  }

  const componentName = parse(componentPath).name
  const meta = parseMeta(tsconfigChecker.getComponentMeta(componentPath))

  const metaDirPath = resolve(__dirname, '../content/meta')
  // if meta dir doesn't exist create
  if (!existsSync(metaDirPath))
    mkdirSync(metaDirPath)

  const metaMdFilePath = join(metaDirPath, `${componentName}.md`)

  let parsedString = '<!-- This file was automatic generated. Do not edit it manually -->\n\n'
  if (meta.props.length)
    parsedString += `<PropsTable :data="${JSON.stringify(meta.props, null, 2).replace(/"/g, '\'')}" />\n`

  if (meta.events.length)
    parsedString += `\n<EmitsTable :data="${JSON.stringify(meta.events, null, 2).replace(/"/g, '\'')}" />\n`

  writeFileSync(metaMdFilePath, parsedString)
})

// Utilities
function parseMeta(meta: ComponentMeta) {
  const props = meta.props
  // Exclude global props
    .filter(prop => !prop.global)
    .map((prop) => {
      let defaultValue = prop.default
      let type = prop.type
      const { name, description, required } = prop

      if (name === 'as')
        defaultValue = defaultValue ?? '"div"'

      if (defaultValue === 'undefined')
        defaultValue = undefined

      if (typeof prop.schema === 'object' && prop.schema.kind === 'enum') {
        const isFlatEnum = prop.schema.schema?.every(val => typeof val === 'string')
        // Only update when prop.type is custom interface, and not `AcceptableValue`
        if (isFlatEnum && /^[A-Z]/.test(prop.type) && !type.includes('AcceptableValue')) {
          const enumValue = prop.schema?.schema?.filter(i => i !== 'undefined') ?? []
          type = enumValue.join(' | ')
        }
      }

      return ({
        name,
        description: md.render(description),
        type: type.replace(/\s*\|\s*undefined/g, ''),
        required,
        default: defaultValue ?? undefined,
      })
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  const events = meta.events
    .map((event) => {
      const { name, type } = event
      return ({
        name,
        description: md.render(eventDescriptionMap.get(name) ?? ''),
        type: type.replace(/\s*\|\s*undefined/g, ''),
      })
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  return {
    props,
    events,
    slots: meta.slots,
  }
}

function getEventFromComponentPath(dir: string) {
  const files = readdirSync(resolve(__dirname, '../../packages/radix-vue/src', dir), { withFileTypes: true }).filter(file => file.name.includes('.vue'))

  files.forEach((file) => {
    const { name, path } = file
    const source = readFileSync(join(path, name), { encoding: 'utf8' })
    const { descriptor } = sfcParse(source, {
      filename: name,
    })

    const code = descriptor.script?.content
    if (code) {
      const result = babelParse(code, {
        sourceType: 'module',
        plugins: ['typescript'],
      })

      for (const node of result.program.body) {
        if (node.type === 'ExportNamedDeclaration' && node.loc) {
          if (node.declaration?.type === 'TSTypeAliasDeclaration') {
            if (node.declaration.typeAnnotation.type === 'TSTypeLiteral') {
              node.declaration.typeAnnotation.members.forEach((member) => {
                if (member.type === 'TSPropertySignature' && member.key.type === 'StringLiteral' && member.leadingComments?.[0].loc) {
                  const key = member.key.value
                  const description = member.leadingComments?.[0].value.replaceAll('*', '').trim()
                  eventDescriptionMap.set(key, description)
                }
                else if (member.type === 'TSPropertySignature' && member.key.type === 'Identifier' && member.leadingComments?.[0].loc) {
                  const key = member.key.name
                  const description = member.leadingComments?.[0].value.replaceAll('*', '').trim()
                  eventDescriptionMap.set(key, description)
                }
              })
            }
            else if (node.declaration.typeAnnotation.type === 'TSIntersectionType') {
              const literalType = node.declaration.typeAnnotation.types.find(t => t.type === 'TSTypeLiteral')
              if (literalType?.type === 'TSTypeLiteral') {
                literalType.members.forEach((member) => {
                  if (member.type === 'TSPropertySignature' && member.key.type === 'StringLiteral' && member.leadingComments?.[0].loc) {
                    const key = member.key.value
                    const description = member.leadingComments?.[0].value.replaceAll('*', '').trim()
                    eventDescriptionMap.set(key, description)
                  }
                })
              }
            }
          }
        }
      }
    }
  })
}

function generateDependencies(componentPath: string) {
  const { name: componentName, dir: componentDir } = parse(componentPath)
  const dir = componentDir.split('/').at(-1) ?? ''

  const source = readFileSync(componentPath, { encoding: 'utf8' })
  const { descriptor } = sfcParse(source, {
    filename: componentName,
  })

  const code = descriptor.script?.content
  if (code) {
    const result = babelParse(code, {
      sourceType: 'module',
      plugins: ['typescript'],
    })

    traverse(result, {
      ImportDeclaration: (path) => {
        const value = path.node.source.value.split('/').at(-1)
        if (value && value.match(/^[A-Z]/) && !value.includes('vue')) {
          const prev = depTree.get(dir) ?? []
          depTree.set(dir, [...new Set([...prev, value])])
        }
      },
    })
  }
}

function getDependencies(dir: string, list = new Set<string>()) {
  const deps = depTree.get(dir)

  deps?.forEach((dep) => {
    list.add(dep)
    getDependencies(dep, list)
  })
  return Array.from(list)
}

function arraysAreEqual<T>(arr1: T[], arr2: T[]): boolean {
  return arr1.length === arr2.length && arr1.every((value, index) => value === arr2[index])
}
