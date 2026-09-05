#!/usr/bin/env node
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, relative } from 'node:path'
import process from 'node:process'
import { transformDataState } from '../src/data-state.mjs'

const DEFAULT_EXTENSIONS = ['vue', 'css', 'scss', 'ts', 'tsx', 'js', 'jsx', 'html', 'md']
const SKIPPED_DIRECTORIES = new Set(['node_modules', 'dist', '.git', '.nuxt', '.output', 'coverage'])

const TRANSFORMS = {
  'data-state': transformDataState,
}

const USAGE = `Usage: reka-ui-codemod <transform> [paths...] [--dry-run] [--ext vue,css,scss,ts,tsx,js,jsx,html,md]

Transforms:
  data-state   Rewrite v2 data-state values (on/off, active/inactive, visible/hidden,
               expanded/collapsed, delayed-open/instant-open) to the v3 vocabulary
               in Tailwind variants and CSS attribute selectors.

Options:
  --dry-run    Report what would change without writing any file.
  --ext        Comma-separated list of file extensions to process.
  -h, --help   Show this message.
`

function print(message) {
  process.stdout.write(`${message}\n`)
}

function parseArgs(argv) {
  const options = { transform: undefined, paths: [], dryRun: false, extensions: DEFAULT_EXTENSIONS, help: false }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--dry-run') {
      options.dryRun = true
    }
    else if (arg === '-h' || arg === '--help') {
      options.help = true
    }
    else if (arg === '--ext') {
      options.extensions = parseExtensions(argv[++i])
    }
    else if (arg.startsWith('--ext=')) {
      options.extensions = parseExtensions(arg.slice('--ext='.length))
    }
    else if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`)
    }
    else if (options.transform === undefined) {
      options.transform = arg
    }
    else {
      options.paths.push(arg)
    }
  }
  if (options.paths.length === 0)
    options.paths.push('.')
  return options
}

function parseExtensions(value = '') {
  const extensions = value
    .split(',')
    .map(ext => ext.trim().replace(/^\./, ''))
    .filter(Boolean)
  if (extensions.length === 0)
    throw new Error('--ext expects a comma-separated list of extensions')
  return extensions
}

function* walk(path, extensions) {
  const stats = statSync(path)
  if (stats.isFile()) {
    if (extensions.has(extname(path).slice(1)))
      yield path
    return
  }
  if (!stats.isDirectory())
    return
  const entries = readdirSync(path, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!SKIPPED_DIRECTORIES.has(entry.name))
        yield * walk(join(path, entry.name), extensions)
    }
    else if (entry.isFile() && extensions.has(extname(entry.name).slice(1))) {
      yield join(path, entry.name)
    }
  }
}

function run(argv) {
  const options = parseArgs(argv)
  if (options.help || options.transform === undefined) {
    print(USAGE)
    return options.help ? 0 : 1
  }

  const transform = TRANSFORMS[options.transform]
  if (!transform) {
    print(`Unknown transform "${options.transform}".\n`)
    print(USAGE)
    return 1
  }

  const extensions = new Set(options.extensions)
  let changedFiles = 0
  let warningCount = 0

  for (const root of options.paths) {
    for (const file of walk(root, extensions)) {
      const source = readFileSync(file, 'utf8')
      const { code, changed, warnings } = transform(source, { filename: file })
      const displayPath = relative(process.cwd(), file) || file

      if (changed) {
        changedFiles++
        if (!options.dryRun)
          writeFileSync(file, code)
        print(`${options.dryRun ? 'would change' : 'changed'} ${displayPath}`)
      }
      for (const warning of warnings) {
        warningCount++
        print(`${displayPath}:${warning.line}: ${warning.message}`)
      }
    }
  }

  const suffix = options.dryRun ? ' (dry run, nothing written)' : ''
  print(`${changedFiles} files changed, ${warningCount} warnings${suffix}`)
  return 0
}

try {
  process.exitCode = run(process.argv.slice(2))
}
catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
}
