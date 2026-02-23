#!/usr/bin/env node
/**
 * Fix remaining issues in migrated stories
 * - Remove <template #controls> blocks
 * - Remove empty <Story /> tags
 */

import { readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = dirname(__dirname)

async function findStoriesFiles(dir, files = []) {
  const entries = await readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      await findStoriesFiles(path, files)
    }
    else if (entry.isFile() && entry.name.endsWith('.stories.vue')) {
      files.push(path)
    }
  }

  return files
}

const storiesFiles = await findStoriesFiles(join(rootDir, 'packages/core/src'))
let fixedCount = 0

for (const filePath of storiesFiles) {
  let content = await readFile(filePath, 'utf-8')
  const originalContent = content

  // Remove <template #controls>...</template> blocks (multiline, non-greedy)
  // Match from <template #controls> to </template> including newlines
  content = content.replace(/\s*<template #controls>[\s\S]*?<\/template>/g, '')

  // Also remove specifically formatted control blocks with just the input
  content = content.replace(/\s*<template\s+#controls>\s*modelValue:[\s\S]*?<\/template>/g, '')

  // Remove empty <Story /> self-closing tags
  content = content.replace(/\s*<Story\s*\/>\s*/g, '\n')

  // Remove empty Story tags with just whitespace/newlines between them
  content = content.replace(/<Story>\s*<\/Story>/g, '')

  // Fix Story tags with only whitespace between opening and closing
  content = content.replace(/<Story\s+title="[^"]*">\s*<\/Story>/g, '')

  // Clean up extra blank lines
  content = content.replace(/\n{3,}/g, '\n\n')

  if (content !== originalContent) {
    await writeFile(filePath, content, 'utf-8')
    console.log(`✓ Fixed: ${relative(rootDir, filePath)}`)
    fixedCount++
  }
}

console.log(`\nFixed ${fixedCount} files`)
