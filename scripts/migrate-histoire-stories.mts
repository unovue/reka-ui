/**
 * One-shot codemod: Histoire *.story.vue → Storybook (sb-addon-vue-csf) *.stories.vue
 * Run from repo root: pnpm tsx scripts/migrate-histoire-stories.mts
 */
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const files = execSync('git ls-files "packages/core/src/**/*.story.vue"', { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter(Boolean)

const manual: string[] = []
let migrated = 0

for (const file of files) {
  const src = readFileSync(file, 'utf8')

  // The single wrapper <Story ...> open tag — usually spans multiple lines,
  // never contains ">" inside attribute values (verified repo-wide).
  const open = src.match(/[ \t]*<Story\b[^>]*>[ \t]*\r?\n/)
  const title = open?.[0].match(/title="([^"]+)"/)?.[1]
  if (!open || !title) {
    manual.push(`${file} — no <Story title="..."> wrapper found`)
    continue
  }

  let out = src.replace(open[0], '')
  // Remove the single wrapper close tag BEFORE Variants become <Story>.
  out = out.replace(/[ \t]*<\/Story>[ \t]*\r?\n/, '')

  out = out
    .replace(/<Variant\s+title="([^"]*)"\s*>/g, '<Story name="$1" asChild>')
    .replace(/<Variant\s*\/>/g, '<Story name="Empty" asChild />')
    .replace(/<\/Variant>/g, '</Story>')

  const importLine = 'import { defineMeta } from \'sb-addon-vue-csf\'\n'
  const metaBlock = `\nconst { Story } = defineMeta({\n  title: '${title}',\n})\n`
  if (/<script setup[^>]*>/.test(out)) {
    out = out.replace(/(<script setup[^>]*>\r?\n)/, `$1${importLine}`)
    out = out.replace(/\r?\n<\/script>/, `\n${metaBlock}</script>`)
  }
  else {
    out = `<script setup lang="ts">\n${importLine}${metaBlock}</script>\n\n${out}`
  }

  if (out.includes('Variant'))
    manual.push(`${file} — leftover <Variant> (unusual attributes?)`)
  if (out.includes('#controls'))
    manual.push(`${file} — has <template #controls> slot`)

  const dest = file.replace(/\.story\.vue$/, '.stories.vue')
  writeFileSync(dest, out)
  execSync(`git rm -q ${JSON.stringify(file)}`)
  execSync(`git add ${JSON.stringify(dest)}`)
  migrated++
}

console.log(`Migrated ${migrated}/${files.length} files.`)
if (manual.length) {
  console.log('\nNeeds manual attention:')
  for (const f of manual)
    console.log(`  - ${f}`)
}
