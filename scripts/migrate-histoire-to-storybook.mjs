#!/usr/bin/env node
/**
 * Migration script: Histoire → Storybook with storybook-vue-addon
 *
 * Converts .story.vue files to .stories.vue format
 */

import { readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = dirname(__dirname)

async function findStoryFiles(dir, files = []) {
  const entries = await readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      await findStoryFiles(path, files)
    }
    else if (entry.isFile() && entry.name.endsWith('.story.vue')) {
      files.push(path)
    }
  }

  return files
}

console.log('Scanning for Histoire story files...\n')

const storyFiles = await findStoryFiles(join(rootDir, 'packages/core/src'))

console.log(`Found ${storyFiles.length} Histoire story files to migrate\n`)

let successCount = 0
let errorCount = 0

for (const filePath of storyFiles) {
  try {
    const content = await readFile(filePath, 'utf-8')
    const newContent = migrateStory(content)

    // Write to new .stories.vue file
    const newPath = filePath.replace('.story.vue', '.stories.vue')
    await writeFile(newPath, newContent, 'utf-8')

    console.log(`✓ ${relative(rootDir, filePath)}`)
    successCount++
  }
  catch (error) {
    console.error(`✗ ${relative(rootDir, filePath)}: ${error.message}`)
    errorCount++
  }
}

console.log(`\nMigration complete: ${successCount} succeeded, ${errorCount} failed`)

function migrateStory(content) {
  // Extract script section
  let script = ''
  const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/)
  if (scriptMatch) {
    script = scriptMatch[1].trim()
  }

  // Extract template section
  let template = ''
  const templateMatch = content.match(/<template>([\s\S]*)<\/template>/)
  if (templateMatch) {
    template = templateMatch[1].trim()
  }

  // Step 1: Remove <template #controls> blocks BEFORE converting tags
  // These are Histoire-specific and should be removed entirely
  template = removeControlBlocks(template)

  // Step 2: Convert Histoire tags to Storybook tags
  template = convertHistoireTags(template)

  // Step 3: Clean up Histoire-specific attributes
  template = template.replace(/\s*:layout="\{[^}]*\}"/g, '')
  template = template.replace(/\s*auto-props-disabled/g, '')

  // Step 4: Remove empty Story tags
  template = template.replace(/\s*<Story\s*>\s*<\/Story>/g, '')
  template = template.replace(/\s*<Story\s*\/>/g, '')

  // Step 5: Clean up whitespace
  template = template.replace(/\n{3,}/g, '\n\n')

  // Build final SFC
  let result = ''

  if (script) {
    result += `<script setup lang="ts">\n${script}\n</script>\n\n`
  }

  result += `<template>\n${template}\n</template>\n`

  return result
}

function removeControlBlocks(template) {
  // Remove <template #controls>...</template> blocks
  // This needs to handle multiline content
  let result = template
  let startIdx = result.indexOf('<template #controls>')

  while (startIdx !== -1) {
    const endIdx = result.indexOf('</template>', startIdx)
    if (endIdx === -1)
      break

    // Remove the entire block including leading whitespace/newlines
    let removeStart = startIdx
    while (removeStart > 0 && /[ \t]/.test(result[removeStart - 1])) {
      removeStart--
    }
    if (removeStart > 0 && result[removeStart - 1] === '\n') {
      removeStart--
    }

    result = result.slice(0, removeStart) + result.slice(endIdx + 11) // 11 = '</template>'.length
    startIdx = result.indexOf('<template #controls>')
  }

  return result
}

function convertHistoireTags(template) {
  // Replace <Story> with <Stories> (root element)
  template = template.replace(/<Story\b/g, '<Stories')
  template = template.replace(/<\/Story>/g, '</Stories>')

  // Replace <Variant> with <Story>
  template = template.replace(/<Variant\b/g, '<Story')
  template = template.replace(/<\/Variant>/g, '</Story>')

  return template
}
