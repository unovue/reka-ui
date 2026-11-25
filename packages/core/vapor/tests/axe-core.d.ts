// `axe-core` is a dependency of vitest-axe, aliased by vitest.vapor.config.ts; only `run` is used.
declare module 'axe-core' {
  interface Result { id: string, nodes: { target: string[] }[] }
  const axe: { run: (context: Element, options?: Record<string, unknown>) => Promise<{ violations: Result[] }> }
  export default axe
}
