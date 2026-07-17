import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC_DIR = fileURLToPath(new URL('../src', import.meta.url))

const PASCAL_CASE = /^[A-Z]/
const CAMEL_BOUNDARY = /([a-z0-9])([A-Z])/g
const ACRONYM_BOUNDARY = /([A-Z]+)([A-Z][a-z])/g

export interface ComponentFamily {
  /** PascalCase source directory name, e.g. `AlertDialog`. */
  name: string
  /** kebab-case subpath key, e.g. `alert-dialog` (imported as `reka-ui/alert-dialog`). */
  key: string
  /** tsdown entry path, relative to the package root. */
  entry: string
}

function toKebabCase(name: string): string {
  return name
    .replace(CAMEL_BOUNDARY, '$1-$2')
    .replace(ACRONYM_BOUNDARY, '$1-$2')
    .toLowerCase()
}

export function getComponentFamilies(): ComponentFamily[] {
  return readdirSync(SRC_DIR, { withFileTypes: true })
    .filter(entry =>
      entry.isDirectory()
      && PASCAL_CASE.test(entry.name)
      && existsSync(join(SRC_DIR, entry.name, 'index.ts')),
    )
    .map(entry => ({
      name: entry.name,
      key: toKebabCase(entry.name),
      entry: `./src/${entry.name}/index.ts`,
    }))
    .sort((a, b) => a.key.localeCompare(b.key))
}
