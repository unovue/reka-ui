// Checks the reka-ui package as it would be published: packs it, then lints the tarball (publint),
// resolves its types the way TypeScript does (Are The Types Wrong), loads every entry from Node
// (smoke.mjs) and type-checks a small ESM consumer (types/). The package is ESM-only. Run after a full build, from the repo
// root: `pnpm build && pnpm package:check`.
//
// publint and attw are fetched with `npx` at the exact versions below, so they stay out of the
// lockfile. Bump them here.
/* eslint-disable no-console, node/prefer-global/process */
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, renameSync, rmSync, symlinkSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'

const PUBLINT = 'publint@0.3.25'
const ATTW = '@arethetypeswrong/cli@0.18.5'

// publint warnings that are known and accepted. Anything else it warns about fails the check.
const PUBLINT_ALLOWED = [
  // The file is one `throw new Error(...)` statement (the documented "no SSR" error). It has no
  // import, export or require for publint to recognise, and it runs fine as CommonJS.
  /pkg\.exports\["\.\/vapor"\]\.node is \.\/dist\/vapor\/ssr\.cjs and ends with the \.cjs extension, but the code is written in ESM/,
]

// The package is ESM-only, so attw runs with its `esm-only` profile: node16 from ESM and bundler
// have to be clean, node10 and node16 from CJS are not checked.
// attw problems that are known and accepted, per entry.
const ATTW_ALLOWED = {
  // `reka-ui/vapor` is typed as ESM (dist/vapor/index.d.ts), but in Node its `node` condition
  // resolves to ssr.cjs, a CommonJS stub that throws the "no SSR" error: attw reports that pair as
  // "masquerading as ESM". The types describe what bundlers load, which is the only place the entry
  // works. Fixing the report needs a .d.cts twin of the whole Vapor declaration tree from the Vapor build.
  vapor: ['false-esm'],
}

const here = import.meta.dirname
const core = resolve(here, '..')
const modules = resolve(here, 'node_modules')
const packed = resolve(modules, 'reka-ui')
const failures = []

function run(title, command, args, { cwd = core, capture = false } = {}) {
  console.log(`\n> ${title}`)
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit', shell: process.platform === 'win32' })
  if (capture)
    process.stdout.write(result.stdout ?? '')
  if (result.error)
    console.log(String(result.error))
  return { ok: result.status === 0, output: result.stdout ?? '' }
}
function step(title, ok) {
  if (!ok)
    failures.push(title)
}

for (const file of ['dist/index.js', 'dist/vapor/index.js', 'dist/nuxt/index.mjs', 'dist/resolver/index.mjs', 'dist/namespaced/index.mjs']) {
  if (!existsSync(resolve(core, file))) {
    console.error(`packages/core/${file} is missing. Build everything first: \`pnpm build\` at the repo root.`)
    process.exit(1)
  }
}

// --- Pack, and unpack into ./node_modules/reka-ui ---
const temp = mkdtempSync(join(tmpdir(), 'reka-ui-pack-'))
if (!run('npm pack', 'npm', ['pack', '--silent', '--pack-destination', temp]).ok)
  process.exit(1)
const tarball = resolve(temp, readdirSync(temp).find(file => file.endsWith('.tgz')))
rmSync(modules, { recursive: true, force: true })
mkdirSync(modules, { recursive: true })
if (!run('unpack the tarball', 'tar', ['-xzf', tarball, '-C', temp]).ok)
  process.exit(1)
renameSync(resolve(temp, 'package'), packed)

// reka-ui's own dependencies and `vue` resolve from packages/core/node_modules, one level up.
// These three are what a project using `reka-ui/nuxt` or `reka-ui/resolver` has installed itself.
const plugins = createRequire(resolve(core, '../plugins/package.json'))
for (const name of ['@nuxt/kit', '@nuxt/schema', 'unplugin-vue-components']) {
  const target = dirname(plugins.resolve(`${name}/package.json`))
  mkdirSync(dirname(resolve(modules, name)), { recursive: true })
  symlinkSync(target, resolve(modules, name), 'junction')
}

// --- Nothing test-only is published ---
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(join(dir, entry.name)) : [relative(packed, join(dir, entry.name)).replaceAll('\\', '/')])
}
const files = walk(packed)
const TEST_ONLY = /\.(?:test|test-d|spec|bench|story)\.|\/__\w+__\/|^src\/test\/|\/(?:story|stories)\//
const strays = files.filter(file => TEST_ONLY.test(file))
console.log(`\n> packed files\n${files.length} files`)
if (strays.length)
  console.log(`FAIL test-only files are published, exclude them in "files":\n  ${strays.join('\n  ')}`)
step('packed files', !strays.length)

// --- publint ---
// eslint-disable-next-line no-control-regex
const plain = text => text.replace(/\u001B\[[\d;]*m/g, '')
const publint = run(`${PUBLINT}`, 'npx', ['--yes', PUBLINT, 'run', tarball], { capture: true })
let section = ''
const reported = []
for (const line of plain(publint.output).split('\n')) {
  if (/^(?:Errors|Warnings|Suggestions):/.test(line))
    section = line.slice(0, line.indexOf(':'))
  else if (/^\d+\. /.test(line) && section !== 'Suggestions')
    reported.push(`${section}: ${line}`)
}
const unexpected = reported.filter(line => !PUBLINT_ALLOWED.some(allowed => allowed.test(line)))
if (unexpected.length)
  console.log(`FAIL publint reported something that is not in PUBLINT_ALLOWED:\n  ${unexpected.join('\n  ')}`)
step('publint', publint.ok && /Linting\.\.\./.test(publint.output) && !unexpected.length)

// --- Are The Types Wrong ---
const allowed = Object.keys(ATTW_ALLOWED)
step('attw', run(`${ATTW} (every entry except ${allowed.join(', ')})`, 'npx', ['--yes', ATTW, tarball, '--profile', 'esm-only', '--exclude-entrypoints', ...allowed]).ok)
for (const [entry, rules] of Object.entries(ATTW_ALLOWED))
  step(`attw (${entry})`, run(`${ATTW} (${entry}, allowing ${rules.join(', ')})`, 'npx', ['--yes', ATTW, tarball, '--profile', 'esm-only', '--entrypoints', entry, '--ignore-rules', ...rules]).ok)

// --- Load every entry from Node ---
step('smoke', run('node smoke.mjs', process.execPath, [resolve(here, 'smoke.mjs')], { cwd: here }).ok)

// --- Type-check a consumer against the packed declarations ---
const tsc = createRequire(import.meta.url).resolve('typescript/bin/tsc')
for (const resolution of ['bundler', 'node16'])
  step(`types (${resolution})`, run(`tsc, moduleResolution ${resolution}`, process.execPath, [tsc, '-p', resolve(here, `types/tsconfig.${resolution}.json`)], { cwd: here }).ok)

rmSync(temp, { recursive: true, force: true })
if (failures.length) {
  console.error(`\nPackage check failed: ${failures.join(', ')}`)
  process.exit(1)
}
console.log('\nPackage check passed')
