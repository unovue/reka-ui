import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: './src/index.ts',
    date: './src/date/index.ts',
    constant: './constant/index.ts',
  },
  fromVite: true,
  platform: 'neutral',
  format: ['esm', 'cjs'],
  tsconfig: './tsconfig.app.json',
  dts: { vue: true, sourcemap: true },
  sourcemap: true,
  hash: false,

  inputOptions: {
    preserveEntrySignatures: 'allow-extension',
    experimental: {
      // Causes major issues with advancedChunks. Not really important here anyway.
      strictExecutionOrder: false,
    },
  },
  outputOptions: {
    minifyInternalExports: false,

    // Don't rely on unbundle: it creates a lot of unwanted files because of the multiple sections of SFC files
    advancedChunks: {
      groups: [
        {
          // Exclude d.ts files so they get bundled up
          // Also not possible when using unbundle mode...
          test: /(?<!\.d\.c?ts)$/,
          name: (id) => {
            const [namespace, file] = id.split('?')[0].split(/[\\/]/g).slice(-2)
            return (
              file
                ? namespace === 'src'
                  ? file.slice(0, file.lastIndexOf('.'))
                  : `${namespace}/${file.slice(0, file.lastIndexOf('.'))}`
                : namespace
            )
          },
        },
      ],
    },
  },
})
